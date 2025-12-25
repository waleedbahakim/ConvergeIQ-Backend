const mongoose = require('mongoose');

const WhyQLDropSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: String, required: true },
    reason: { type: String, required: true },
    drop_rate: { type: String, required: false },
    keywords: [{ type: String }],
    recommendation: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

WhyQLDropSchema.index({ client_id: 1, date: 1, reason: 1 }, { unique: true });

module.exports = mongoose.model('WhyQLDrop', WhyQLDropSchema);
