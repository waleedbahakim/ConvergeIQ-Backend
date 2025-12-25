const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    client_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    crm_provider: {
        type: String,
        enum: ['LeadSquared', 'Zoho', 'Other'],
        default: 'Other'
    },
    bot_provider: {
        type: String,
        enum: ['Gallabox', 'Voice Bot', 'Other'],
        default: 'Other'
    },
    api_credentials: {
        type: Object, // Store encrypted keys here later
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Client', ClientSchema);
