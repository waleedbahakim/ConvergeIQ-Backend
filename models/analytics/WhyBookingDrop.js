const mongoose = require('mongoose');

const WhyBookingDropSchema = new mongoose.Schema({
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: String, required: true },
    reason: { type: String, required: true },
    count: { type: Number, required: true },
    booking_loss_rate: { type: String, required: false },
    recommendation: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

WhyBookingDropSchema.index({ client_id: 1, date: 1, reason: 1 }, { unique: true });

module.exports = mongoose.model('WhyBookingDrop', WhyBookingDropSchema);
