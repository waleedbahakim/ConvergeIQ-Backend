const express = require('express');
const router = express.Router();
const reasoningController = require('../controllers/reasoningController');
const auth = require('../middleware/authMiddleware');

// Trigger analysis (could be a cron job, but exposed as API for now)
router.post('/trigger', auth, reasoningController.runAnalysis);

// Get results for dashboard
router.get('/', auth, reasoningController.getDeterminations);

module.exports = router;
