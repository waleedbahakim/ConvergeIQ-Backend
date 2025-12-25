const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    external_id: { type: String, required: true, unique: true }, // Gallabox Message ID
    text: { type: String },
    sender_type: { type: String, enum: ['bot', 'user', 'agent'], required: true },
    timestamp: { type: Date, required: true },
    step_id: { type: String }, // For bot flows
    meta: { type: Object } // Attachments, etc.
});

MessageSchema.index({ conversation_id: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);
