const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.get('/kpis', requireAuth, dashboardController.getKPIs);

module.exports = router;