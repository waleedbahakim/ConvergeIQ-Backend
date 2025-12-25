const mongoose = require('mongoose');

const DailyFunnelMetricSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    leads: { type: Number, default: 0 },
    bot_triggered: { type: Number, default: 0 },
    interacted: { type: Number, default: 0 },
    ql: { type: Number, default: 0 },
    sv: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },

    // Percentages (Pre-calculated or calculated on fly? Storing helps history)
    funnel_percentages: {
        response_rate: Number, // Interacted / Bot Triggered
        ql_rate: Number, // QL / Interacted
        booking_rate: Number // Bookings / QL
    },

    updatedAt: { type: Date, default: Date.now }
});

// Unique per client per day
DailyFunnelMetricSchema.index({ client_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyFunnelMetric', DailyFunnelMetricSchema);
