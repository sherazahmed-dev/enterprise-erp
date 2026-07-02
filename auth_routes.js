const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public Routes (Bina login/token ke access ho sakti hai)
router.post('/login', authController.login);

// Protected Routes (Sirf valid token ke sath access hogi)
router.get('/profile', requireAuth, authController.getProfile);

module.exports = router;