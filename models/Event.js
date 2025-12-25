const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    lead_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    type: {
        type: String,
        required: true,
        enum: ['bot_sent', 'user_replied', 'stage_change', 'site_visit_scheduled', 'site_visit_done', 'booking', 'prebooking', 'direct_booking', 'mql', 'sql']
    },
    timestamp: {
        type: Date,
        required: true
    },
    data: Object, // Metadata (e.g., message content, old_stage, new_stage)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Event', EventSchema);
