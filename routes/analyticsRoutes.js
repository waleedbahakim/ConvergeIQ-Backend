const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');

// Compute metrics for a specific day (Manually triggered for MVP)
router.post('/compute', auth, analyticsController.computeDailyMetrics);

// Get metrics for dashboard
router.get('/', auth, analyticsController.getMetrics);

// Get report data (custom range)
router.post('/report', auth, analyticsController.getReportData);

module.exports = router;
