const mongoose = require('mongoose');

const WhyBotDropSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    reason: { type: String, required: true },
    impact: { type: String, enum: ['High', 'Medium', 'Low'], required: false },
    count: { type: Number, required: true },
    recommendation: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

WhyBotDropSchema.index({ client_id: 1, date: 1, reason: 1 }, { unique: true });

module.exports = mongoose.model('WhyBotDrop', WhyBotDropSchema);
