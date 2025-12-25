const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    external_id: { type: String, required: true, unique: true }, // Gallabox Conversation ID
    lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    status: { type: String, required: true }, // open, resolved, etc.
    channel: { type: String, default: 'whatsapp' },
    created_at: { type: Date }, // Original creation time from Gallabox
    updated_at: { type: Date },
    meta: { type: Object } // Any extra context
});

ConversationSchema.index({ client_id: 1, external_id: 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
