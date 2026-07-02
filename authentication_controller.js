const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const query = `
        SELECT u.*, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ? AND u.is_active = 1
    `;

    db.get(query, [email], (err, user) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role_id: user.role_id, 
                role_name: user.role_name 
            }, 
            JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role_name
            }
        });
    });
};

const getProfile = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT u.id, u.name, u.email, u.created_at, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
    `;

    db.get(query, [userId], (err, user) => {
        if (err) return res.status(500).json({ error: 'Internal server error.' });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        
        res.json({ user });
    });
};

module.exports = {
    login,
    getProfile
};