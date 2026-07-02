const db = require('../config/db');

// --- Suppliers ---
const getSuppliers = (req, res) => {
    db.all(`SELECT * FROM suppliers ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching suppliers.' });
        res.json(rows);
    });
};

const createSupplier = (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required.' });

    db.run(`INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)`,
        [name, contact_person, email, phone, address],
        function(err) {
            if (err) return res.status(400).json({ error: 'Failed to create supplier.' });
            res.status(201).json({ id: this.lastID, message: 'Supplier registered successfully.' });
        }
    );
};

// --- Purchase Orders ---
const getPurchaseOrders = (req, res) => {
    const query = `
        SELECT po.*, s.name as supplier_name 
        FROM purchase_orders po 
        LEFT JOIN suppliers s ON po.supplier_id = s.id 
        ORDER BY po.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching purchase orders.' });
        res.json(rows);
    });
};

const createPurchaseOrder = (req, res) => {
    const { supplier_id, total_amount, status } = req.body;
    
    if (!supplier_id) return res.status(400).json({ error: 'Supplier ID is required.' });

    db.run(`INSERT INTO purchase_orders (supplier_id, total_amount, status) VALUES (?, ?, ?)`,
        [supplier_id, total_amount || 0, status || 'Pending'],
        function(err) {
            if (err) return res.status(400).json({ error: 'Failed to create purchase order.' });
            res.status(201).json({ id: this.lastID, message: 'Purchase order generated.' });
        }
    );
};

module.exports = {
    getSuppliers,
    createSupplier,
    getPurchaseOrders,
    createPurchaseOrder
};