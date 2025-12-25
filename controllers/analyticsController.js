const DailyFunnelMetric = require('../models/DailyFunnelMetric');
const Lead = require('../models/Lead');
const Event = require('../models/Event');
const Client = require('../models/Client');

// Helper to calculate start/end of a day
const getDayRange = (dateStr) => {
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

exports.computeDailyMetrics = async (req, res) => {
    const { client_id, date } = req.body; // date in YYYY-MM-DD

    try {
        const { start, end } = getDayRange(date);

        // 1. Leads (Created on this date)
        const leadsCount = await Lead.countDocuments({
            client_id,
            createdAt: { $gte: start, $lte: end }
        });

        // 2. Events Aggregation
        // We can run separate counts or one aggregation pipeline
        const botTriggered = await Event.countDocuments({
            client_id,
            type: 'bot_sent',
            timestamp: { $gte: start, $lte: end }
        });

        const interacted = await Event.countDocuments({
            client_id,
            type: 'user_replied',
            timestamp: { $gte: start, $lte: end }
        });

        const ql = await Event.countDocuments({
            client_id,
            type: 'stage_change',
            'data.new_stage': 'QL', // Assuming structure
            timestamp: { $gte: start, $lte: end }
        });

        const sv = await Event.countDocuments({
            client_id,
            type: 'site_visit',
            timestamp: { $gte: start, $lte: end }
        });

        const bookings = await Event.countDocuments({
            client_id,
            type: 'booking',
            timestamp: { $gte: start, $lte: end }
        });

        // Calculate Percentages
        const response_rate = botTriggered > 0 ? (interacted / botTriggered) * 100 : 0;
        const ql_rate = interacted > 0 ? (ql / interacted) * 100 : 0;
        const booking_rate = ql > 0 ? (bookings / ql) * 100 : 0;

        // Upsert Metric
        const metric = await DailyFunnelMetric.findOneAndUpdate(
            { client_id, date },
            {
                leads: leadsCount,
                bot_triggered: botTriggered,
                interacted,
                ql,
                sv,
                bookings,
                funnel_percentages: {
                    response_rate: parseFloat(response_rate.toFixed(1)),
                    ql_rate: parseFloat(ql_rate.toFixed(1)),
                    booking_rate: parseFloat(booking_rate.toFixed(1))
                },
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json(metric);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMetrics = async (req, res) => {
    try {
        // Assuming client_id is passed in via auth middleware or query (for now query or body for simplicity in MVP demo)
        // Ideally req.user.client_id

        // For this demo let's allow passing client_id in query if admin, or derive from token
        // Fallback: getting metrics for specific client
        const clientId = req.query.client_id || (req.user ? req.user.client_id : null);

        if (!clientId) {
            return res.status(400).json({ msg: 'Client ID required' });
        }

        const metrics = await DailyFunnelMetric.find({ client_id: clientId }).sort({ date: -1 });
        res.json(metrics);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
