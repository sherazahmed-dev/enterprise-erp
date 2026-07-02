const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- Departments ---
const getDepartments = (req, res) => {
    db.all(`SELECT * FROM departments ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching departments.' });
        res.json(rows);
    });
};

const createDepartment = (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required.' });

    db.run(`INSERT INTO departments (name, description) VALUES (?, ?)`, [name, description], function(err) {
        if (err) return res.status(400).json({ error: 'Department name already exists or invalid data.' });
        res.status(201).json({ id: this.lastID, name, description, message: 'Department created.' });
    });
};

// --- Employees ---
const getEmployees = (req, res) => {
    const query = `
        SELECT e.id, u.name, u.email, d.name as department_name, des.title as designation_title, e.status, e.phone
        FROM employees e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN designations des ON e.designation_id = des.id
        ORDER BY e.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching employees.' });
        res.json(rows);
    });
};

const createEmployee = (req, res) => {
    const { name, email, password, department_id, phone } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and temporary password are required.' });
    }

    // Default Role ID for standard employee is 8
    const employeeRoleId = 8;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.serialize(() => {
        db.run(`BEGIN TRANSACTION`);
        
        // 1. Create the Authentication User
        db.run(`INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)`, 
            [name, email, hash, employeeRoleId], 
            function(err) {
                if (err) {
                    db.run(`ROLLBACK`);
                    return res.status(400).json({ error: 'Email already registered.' });
                }
                
                const userId = this.lastID;
                
                // 2. Create the linked Employee Profile
                db.run(`INSERT INTO employees (user_id, department_id, join_date, phone, status) VALUES (?, ?, date('now'), ?, 'Active')`,
                    [userId, department_id || null, phone || null],
                    function(err2) {
                        if (err2) {
                            db.run(`ROLLBACK`);
                            return res.status(400).json({ error: 'Failed to create employee profile.' });
                        }
                        
                        db.run(`COMMIT`);
                        res.status(201).json({ message: 'Employee successfully registered and integrated with Auth System.' });
                    }
                );
            }
        );
    });
};

module.exports = {
    getDepartments,
    createDepartment,
    getEmployees,
    createEmployee
};