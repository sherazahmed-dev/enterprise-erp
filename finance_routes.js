const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { requireAuth } = require('../middleware/auth');

router.get('/accounts', requireAuth, financeController.getAccounts);
router.post('/accounts', requireAuth, financeController.createAccount);

router.get('/transactions', requireAuth, financeController.getTransactions);
router.post('/transactions', requireAuth, financeController.createTransaction);

module.exports = router;