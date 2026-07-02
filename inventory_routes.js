const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { requireAuth } = require('../middleware/auth');

router.get('/categories', requireAuth, inventoryController.getCategories);
router.post('/categories', requireAuth, inventoryController.createCategory);

router.get('/products', requireAuth, inventoryController.getProducts);
router.post('/products', requireAuth, inventoryController.createProduct);

module.exports = router;