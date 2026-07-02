const db = require('../config/db');

const getAuditLogs = (req, res) => {
    // Super Admin level check could be enforced here
    const query = `
        SELECT * FROM audit_logs 
        ORDER BY id DESC 
        LIMIT 100
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error fetching audit logs.' });
        res.json(rows);
    });
};

module.exports = {
    getAuditLogs
};