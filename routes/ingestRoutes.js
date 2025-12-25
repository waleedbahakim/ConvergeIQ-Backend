const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');
const auth = require('../middleware/authMiddleware');

// Protected route to trigger ingestion manually
router.post('/trigger', auth, ingestController.triggerIngestion);

module.exports = router;
