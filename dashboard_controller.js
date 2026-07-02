const db = require('../config/db');

const getKPIs = (req, res) => {
    // Perform parallel queries for system metrics
    const kpis = {
        totalEmployees: 0,
        activeDepartments: 0,
        pendingLeaves: 0,
        systemUsers: 0
    };

    db.serialize(() => {
        db.get(`SELECT count(*) as count FROM employees WHERE status = 'Active'`, (err, row) => {
            if (!err && row) kpis.totalEmployees = row.count;
        });
        db.get(`SELECT count(*) as count FROM departments`, (err, row) => {
            if (!err && row) kpis.activeDepartments = row.count;
        });
        db.get(`SELECT count(*) as count FROM leaves WHERE status = 'Pending'`, (err, row) => {
            if (!err && row) kpis.pendingLeaves = row.count;
        });
        db.get(`SELECT count(*) as count FROM users WHERE is_active = 1`, (err, row) => {
            if (!err && row) {
                kpis.systemUsers = row.count;
                // Return payload after last query completes in serialized block
                res.json(kpis);
            } else {
                res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
            }
        });
    });
};

module.exports = {
    getKPIs
};