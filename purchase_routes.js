const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { requireAuth } = require('../middleware/auth');

router.get('/suppliers', requireAuth, purchaseController.getSuppliers);
router.post('/suppliers', requireAuth, purchaseController.createSupplier);

router.get('/orders', requireAuth, purchaseController.getPurchaseOrders);
router.post('/orders', requireAuth, purchaseController.createPurchaseOrder);

module.exports = router;