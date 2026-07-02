const db = require('../config/db');

const auditLogger = (req, res, next) => {
    // Only log actions that modify data (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        
        // Intercept the response finish event to ensure the action was successful
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user ? req.user.id : null;
                const userEmail = req.user ? req.user.email : 'System/Anonymous';
                const action = req.method;
                const endpoint = req.originalUrl;
                const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

                db.run(
                    `INSERT INTO audit_logs (user_id, user_email, action, endpoint, ip_address) VALUES (?, ?, ?, ?, ?)`,
                    [userId, userEmail, action, endpoint, ip],
                    (err) => {
                        if (err) console.error('Audit Log Failed:', err.message);
                    }
                );
            }
        });
    }
    next();
};

module.exports = { auditLogger };