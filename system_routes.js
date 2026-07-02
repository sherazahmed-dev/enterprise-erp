const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { requireAuth } = require('../middleware/auth');

router.get('/audit-logs', requireAuth, systemController.getAuditLogs);

module.exports = router;