const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Generally webhooks are public endpoints secured by secrets/signatures, not JWT auth
router.post('/leadsquared/:client_id', webhookController.leadSquaredWebhook);
router.post('/gallabox/:client_id', webhookController.gallaboxWebhook);

module.exports = router;
