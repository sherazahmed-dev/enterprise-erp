const db = require('../config/db');

// --- Categories ---
const getCategories = (req, res) => {
    db.all(`SELECT * FROM categories ORDER BY name ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching categories.' });
        res.json(rows);
    });
};

const createCategory = (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    db.run(`INSERT INTO categories (name) VALUES (?)`, [name], function(err) {
        if (err) return res.status(400).json({ error: 'Category already exists.' });
        res.status(201).json({ id: this.lastID, name, message: 'Category created.' });
    });
};

// --- Products ---
const getProducts = (req, res) => {
    const query = `
        SELECT p.*, c.name as category_name, u.short_name as unit_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.unit_id = u.id
        ORDER BY p.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching products.' });
        res.json(rows);
    });
};

const createProduct = (req, res) => {
    const { name, sku, category_id, unit_id, price, cost, min_stock, current_stock } = req.body;
    
    if (!name || !sku) return res.status(400).json({ error: 'Product name and SKU are required.' });

    db.run(`INSERT INTO products (name, sku, category_id, unit_id, price, cost, min_stock, current_stock) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, sku, category_id, unit_id || 1, price || 0, cost || 0, min_stock || 0, current_stock || 0],
        function(err) {
            if (err) return res.status(400).json({ error: 'Failed to create product or SKU already exists.' });
            res.status(201).json({ id: this.lastID, message: 'Product created successfully.' });
        }
    );
};

module.exports = {
    getCategories,
    createCategory,
    getProducts,
    createProduct
};