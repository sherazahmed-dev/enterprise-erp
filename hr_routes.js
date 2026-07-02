const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Note: In an enterprise system, requireRole could enforce ['Super Admin', 'HR Manager'] for writes. 
// For Iteration 2, requireAuth handles basic route protection.

// Departments
router.get('/departments', requireAuth, hrController.getDepartments);
router.post('/departments', requireAuth, hrController.createDepartment);

// Employees
router.get('/employees', requireAuth, hrController.getEmployees);
router.post('/employees', requireAuth, hrController.createEmployee);

module.exports = router;