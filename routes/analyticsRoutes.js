const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');

// Compute metrics for a specific day (Manually triggered for MVP)
router.post('/compute', auth, analyticsController.computeDailyMetrics);

// Get metrics for dashboard
router.get('/', auth, analyticsController.getMetrics);

module.exports = router;
