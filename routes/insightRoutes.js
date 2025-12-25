const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, insightController.getInsights);

module.exports = router;
