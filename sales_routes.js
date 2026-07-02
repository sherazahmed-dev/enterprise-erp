const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { requireAuth } = require('../middleware/auth');

router.get('/customers', requireAuth, salesController.getCustomers);
router.post('/customers', requireAuth, salesController.createCustomer);

router.get('/orders', requireAuth, salesController.getSalesOrders);
router.post('/orders', requireAuth, salesController.createSalesOrder);

module.exports = router;