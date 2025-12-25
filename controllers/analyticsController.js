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

// Internal method for autonomous/cron use
const computeDailyMetricsInternal = async (client_id, date) => {
    try {
        const { start, end } = getDayRange(date);

        // 1. Leads (Created on this date)
        const leadsCount = await Lead.countDocuments({
            client_id,
            createdAt: { $gte: start, $lte: end }
        });

        // 2. Events Aggregation
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

        const mql = await Event.countDocuments({
            client_id,
            type: 'stage_change',
            'data.new_stage': 'MQL',
            timestamp: { $gte: start, $lte: end }
        });

        const sql = await Event.countDocuments({
            client_id,
            type: 'stage_change',
            'data.new_stage': 'SQL',
            timestamp: { $gte: start, $lte: end }
        });

        const ql = await Event.countDocuments({
            client_id,
            type: 'stage_change',
            'data.new_stage': 'QL',
            timestamp: { $gte: start, $lte: end }
        });

        // sv is legacy field, mapping to sv_scheduled for now, or just keeping separate?
        // Let's use the new event types
        const sv_scheduled = await Event.countDocuments({
            client_id,
            type: 'site_visit_scheduled',
            timestamp: { $gte: start, $lte: end }
        });

        const sv_done = await Event.countDocuments({
            client_id,
            type: 'site_visit_done',
            timestamp: { $gte: start, $lte: end }
        });

        const bookings = await Event.countDocuments({
            client_id,
            type: 'booking',
            timestamp: { $gte: start, $lte: end }
        });

        const prebookings = await Event.countDocuments({
            client_id,
            type: 'prebooking',
            timestamp: { $gte: start, $lte: end }
        });

        const direct_bookings = await Event.countDocuments({
            client_id,
            type: 'direct_booking',
            timestamp: { $gte: start, $lte: end }
        });

        // Use sv_scheduled as the main "sv" count for legacy compatibility if needed
        const sv = sv_scheduled;

        // 3. AI Insights Aggregation
        const ChatInsight = require('../models/ChatInsight');
        const insights = await ChatInsight.find({
            client_id,
            analyzed_at: { $gte: start, $lte: end }
        });

        const drop_reasons = {};
        const intent_distribution = {};
        const sentiment_distribution = {};

        insights.forEach(i => {
            // Drop Reasons
            if (i.drop_reason && i.drop_reason !== 'N/A') {
                drop_reasons[i.drop_reason] = (drop_reasons[i.drop_reason] || 0) + 1;
            }
            // Intent
            if (i.primary_intent) {
                intent_distribution[i.primary_intent] = (intent_distribution[i.primary_intent] || 0) + 1;
            }
            // Sentiment
            if (i.sentiment) {
                sentiment_distribution[i.sentiment] = (sentiment_distribution[i.sentiment] || 0) + 1;
            }
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
                mql,
                sql,
                sv: sv_scheduled,
                sv_scheduled,
                sv_done,
                bookings,
                prebookings,
                direct_bookings,

                // New AI Aggregates
                drop_reasons,
                intent_distribution,
                sentiment_distribution,

                funnel_percentages: {
                    response_rate: parseFloat(response_rate.toFixed(1)),
                    ql_rate: parseFloat(ql_rate.toFixed(1)),
                    booking_rate: parseFloat(booking_rate.toFixed(1))
                },
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return metric;
    } catch (err) {
        console.error("Compute Metrics Internal Error:", err);
        throw err;
    }
};

exports.computeDailyMetricsInternal = computeDailyMetricsInternal;

exports.computeDailyMetrics = async (req, res) => {
    const { client_id, date } = req.body;
    try {
        const metric = await computeDailyMetricsInternal(client_id, date);
        res.json(metric);
    } catch (err) {
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

exports.getReportData = async (req, res) => {
    try {
        const { client_id, startDate, endDate } = req.body;

        if (!client_id || !startDate || !endDate) {
            return res.status(400).json({ msg: 'Missing parameters' });
        }

        const metrics = await DailyFunnelMetric.find({
            client_id,
            date: { $gte: startDate, $lte: endDate }
        });

        // Aggregate
        const report = {
            leads: 0,
            bot_triggered: 0,
            interacted: 0,
            mql: 0,
            ql: 0,
            sql: 0,
            sv_scheduled: 0,
            sv_done: 0,
            bookings: 0,
            prebookings: 0,
            direct_bookings: 0,
            drop_reasons: {},
            intent_distribution: {},
            sentiment_distribution: {}
        };

        const mergeMap = (target, source) => {
            if (!source) return;
            // Handle Mongoose Map or POJO
            const sourceObj = source instanceof Map ? Object.fromEntries(source) : source;
            for (const [key, val] of Object.entries(sourceObj || {})) {
                target[key] = (target[key] || 0) + val;
            }
        };

        metrics.forEach(m => {
            report.leads += m.leads || 0;
            report.bot_triggered += m.bot_triggered || 0;
            report.interacted += m.interacted || 0;
            report.mql += m.mql || 0;
            report.ql += m.ql || 0;
            report.sql += m.sql || 0;
            report.sv_scheduled += (m.sv_scheduled || m.sv || 0);
            report.sv_done += m.sv_done || 0;
            report.bookings += m.bookings || 0;
            report.prebookings += m.prebookings || 0;
            report.direct_bookings += m.direct_bookings || 0;

            mergeMap(report.drop_reasons, m.drop_reasons);
            mergeMap(report.intent_distribution, m.intent_distribution);
            mergeMap(report.sentiment_distribution, m.sentiment_distribution);
        });

        // Calculate Rates on Aggregated Data
        const safeDiv = (n, d) => d > 0 ? (n / d) * 100 : 0;

        const finalReport = {
            ...report,
            response_rate: parseFloat(safeDiv(report.interacted, report.bot_triggered).toFixed(1)), // AI Interaction %
            trigger_rate: parseFloat(safeDiv(report.bot_triggered, report.leads).toFixed(1)), // Message Triggered %
            ql_rate: parseFloat(safeDiv(report.ql, report.interacted).toFixed(1)),
            mql_rate: parseFloat(safeDiv(report.mql, report.interacted).toFixed(1)),
            sql_rate: parseFloat(safeDiv(report.sql, report.mql).toFixed(1)),
            sv_rate: parseFloat(safeDiv(report.sv_done, report.sv_scheduled).toFixed(1)),
            booking_rate: parseFloat(safeDiv(report.bookings, report.sv_done > 0 ? report.sv_done : report.ql).toFixed(1)),
        };

        res.json(finalReport);

    } catch (err) {
        console.error('Report Error:', err);
        res.status(500).send('Server Error');
    }
};
