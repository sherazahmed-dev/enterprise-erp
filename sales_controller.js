const db = require('../config/db');

// --- Customers ---
const getCustomers = (req, res) => {
    db.all(`SELECT * FROM customers ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching customers.' });
        res.json(rows);
    });
};

const createCustomer = (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required.' });

    db.run(`INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)`,
        [name, email, phone, address],
        function(err) {
            if (err) return res.status(400).json({ error: 'Failed to create customer.' });
            res.status(201).json({ id: this.lastID, message: 'Customer added successfully.' });
        }
    );
};

// --- Sales Orders ---
const getSalesOrders = (req, res) => {
    const query = `
        SELECT so.*, c.name as customer_name 
        FROM sales_orders so 
        LEFT JOIN customers c ON so.customer_id = c.id 
        ORDER BY so.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching orders.' });
        res.json(rows);
    });
};

const createSalesOrder = (req, res) => {
    const { customer_id, total_amount, status } = req.body;
    
    if (!customer_id) return res.status(400).json({ error: 'Customer ID is required to place an order.' });

    db.run(`INSERT INTO sales_orders (customer_id, total_amount, status) VALUES (?, ?, ?)`,
        [customer_id, total_amount || 0, status || 'Pending'],
        function(err) {
            if (err) return res.status(400).json({ error: 'Failed to create sales order.' });
            res.status(201).json({ id: this.lastID, message: 'Sales order generated.' });
        }
    );
};

module.exports = {
    getCustomers,
    createCustomer,
    getSalesOrders,
    createSalesOrder
};