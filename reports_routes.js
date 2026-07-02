const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { requireAuth } = require('../middleware/auth');

router.get('/analytics', requireAuth, reportsController.getAnalyticsSummary);
router.get('/export/:module', requireAuth, reportsController.exportReport);

module.exports = router;