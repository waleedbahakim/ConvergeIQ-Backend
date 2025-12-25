const mongoose = require('mongoose');

const ChatInsightSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },

    // AI Analysis
    outcome: { type: String, enum: ['success', 'noOutcome', 'dropAtStep'], required: true },
    drop_reason: { type: String },
    primary_intent: { type: String },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    suggested_action: { type: String },
    confidence: { type: Number },
    key_phrases: [{ type: String }],

    analyzed_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatInsight', ChatInsightSchema);
