const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    external_id: {
        type: String,
        required: true // ID from the CRM
    },
    name: String,
    email: String,
    phone: String,
    stage: {
        type: String,
        default: 'New'
    }, // e.g., New, QL, Won
    custom_data: Object, // Store raw data from CRM
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// Compound index to prevent duplicates per client
LeadSchema.index({ client_id: 1, external_id: 1 }, { unique: true });

module.exports = mongoose.model('Lead', LeadSchema);
