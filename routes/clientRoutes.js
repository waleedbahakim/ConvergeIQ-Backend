const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// TODO: Add auth middleware to protect these routes
router.post('/', clientController.createClient);
router.get('/', clientController.getClients);

module.exports = router;
