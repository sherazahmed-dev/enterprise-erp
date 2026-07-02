const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'erp.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
    console.log('Connected to Enterprise SQLite database.');
});

// Initialize Schema & Seed Data
db.serialize(() => {
    // Enable Foreign Keys
    db.run(`PRAGMA foreign_keys = ON`);

    // ==========================================
    // 1. AUTHENTICATION & CORE TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module TEXT NOT NULL,
        action TEXT NOT NULL,
        UNIQUE(module, action)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER,
        permission_id INTEGER,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
    )`);

    // ==========================================
    // 2. HUMAN RESOURCE (HR) TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS designations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        department_id INTEGER,
        base_salary REAL,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        department_id INTEGER,
        designation_id INTEGER,
        join_date DATE,
        phone TEXT,
        status TEXT DEFAULT 'Active',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL,
        FOREIGN KEY (designation_id) REFERENCES designations (id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        date DATE,
        status TEXT,
        check_in DATETIME,
        check_out DATETIME,
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        start_date DATE,
        end_date DATE,
        type TEXT,
        status TEXT DEFAULT 'Pending',
        reason TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE
    )`);

    // ==========================================
    // 3. INVENTORY TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        short_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        category_id INTEGER,
        unit_id INTEGER,
        price REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        current_stock INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (unit_id) REFERENCES units (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        type TEXT, -- 'IN' or 'OUT'
        quantity INTEGER,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        remarks TEXT,
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // ==========================================
    // 4. SALES TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price REAL,
        subtotal REAL,
        FOREIGN KEY (order_id) REFERENCES sales_orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // ==========================================
    // 5. PURCHASE TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price REAL,
        subtotal REAL,
        FOREIGN KEY (order_id) REFERENCES purchase_orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // ==========================================
    // 6. FINANCE TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_name TEXT NOT NULL,
        account_type TEXT NOT NULL, -- e.g., 'Cash', 'Bank', 'Credit'
        balance REAL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        type TEXT NOT NULL, -- 'Income' or 'Expense'
        amount REAL NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts (id)
    )`);

    // ==========================================
    // 7. SYSTEM & AUDIT TABLES
    // ==========================================
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_email TEXT,
        action TEXT,
        endpoint TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ==========================================
    // DATABASE INDEXES FOR OPTIMIZATION
    // ==========================================
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp)`);

    // ==========================================
    // SEED INITIAL DATA (Roles, Super Admin, defaults)
    // ==========================================
    db.get(`SELECT count(*) as count FROM roles`, (err, row) => {
        if (err) {
            console.error('Error checking roles:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Seeding initial database state...');
            
            // Insert default roles
            const roles = [
                'Super Admin', 'Admin', 'HR Manager', 
                'Inventory Manager', 'Sales Manager', 
                'Purchase Manager', 'Finance Manager', 'Employee'
            ];
            
            const stmt = db.prepare(`INSERT INTO roles (name, description) VALUES (?, ?)`);
            roles.forEach(role => stmt.run(role, `${role} privileges`));
            stmt.finalize();

            // Insert Super Admin & Initial Structure
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync('admin123', salt);
            
            db.run(`INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)`, 
                ['System Administrator', 'admin@erp.com', hash, 1], 
                function(err) {
                    if (err) console.error('Failed to seed Super Admin:', err);
                    else {
                        console.log('Super Admin seeded successfully. Credentials: admin@erp.com / admin123');
                        const adminUserId = this.lastID;
                        
                        // HR: Seed Admin Department & Profile
                        db.run(`INSERT INTO departments (name, description) VALUES ('Administration', 'System Management & Executive Board')`, function() {
                            const deptId = this.lastID;
                            db.run(`INSERT INTO designations (title, department_id, base_salary) VALUES ('CEO', ?, 150000)`, [deptId], function() {
                                db.run(`INSERT INTO employees (user_id, department_id, designation_id, join_date, phone, status) 
                                    VALUES (?, ?, ?, date('now'), '555-0100', 'Active')`, 
                                    [adminUserId, deptId, this.lastID]);
                            });
                        });

                        // Inventory: Seed base units & categories
                        db.run(`INSERT OR IGNORE INTO units (name, short_name) VALUES ('Pieces', 'pcs'), ('Kilograms', 'kg'), ('Liters', 'L')`);
                        db.run(`INSERT OR IGNORE INTO categories (name) VALUES ('General'), ('Electronics'), ('Hardware')`);
                        
                        // Finance: Seed default Corporate Bank Account
                        db.run(`INSERT OR IGNORE INTO accounts (account_name, account_type, balance) VALUES ('Main Corporate Bank', 'Bank', 100000.00)`);
                    }
                }
            );
        }
    });
});

module.exports = db;