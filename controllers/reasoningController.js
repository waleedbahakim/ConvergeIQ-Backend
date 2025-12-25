const WhyBotDrop = require('../models/analytics/WhyBotDrop');
const WhyQLDrop = require('../models/analytics/WhyQLDrop');
const WhyBookingDrop = require('../models/analytics/WhyBookingDrop');
const operationalReasoning = require('../services/reasoning/operationalReasoning');
const conversationReasoning = require('../services/reasoning/conversationReasoning');

// Mock data fetchers for now since we don't have a full live DB of 1000s of events
// In production, these would query the 'Lead' and 'Event' collections.
const getBotDropLeads = async (client_id) => {
    // Return sample data for the AI to analyze
    return [
        { id: 1, created_at: "2023-10-27T23:00:00Z", source: "Facebook", phone: null },
        { id: 2, created_at: "2023-10-27T02:00:00Z", source: "Google", phone: "+1234567890" }, // Night time
        { id: 3, created_at: "2023-10-27T14:00:00Z", source: "Direct", phone: null },
    ];
};

const getQLDropTranscripts = async (client_id) => {
    return [
        "User: Hi, price? Bot: $500. User: Too expensive.",
        "User: Where are you located? Bot: NY. User: Oh looking for LA.",
        "User: Just browsing thanks.",
        "User: How much? Bot: $500. User: ok bye."
    ];
};

const getBookingDropJourneys = async (client_id) => {
    return [
        { lead_id: 1, events: [{ type: 'QL', time: '10:00' }, { type: 'FollowUp', time: 'Tomorrow 10:00' }] }, // Delayed
        { lead_id: 2, events: [{ type: 'QL', time: '12:00' }] }, // No follow up
    ];
};

exports.runAnalysis = async (req, res) => {
    const { client_id } = req.query; // Authenticated user's client_id
    const today = new Date().toISOString().split('T')[0];

    try {
        // 1. Analyze Bot Drops
        const botDropLeads = await getBotDropLeads(client_id);
        const botReasons = await operationalReasoning.analyzeBotDrops(botDropLeads, { start: "09:00", end: "18:00" });

        // Save to DB (upsert)
        for (const r of botReasons) {
            await WhyBotDrop.findOneAndUpdate(
                { client_id, date: today, reason: r.reason },
                { ...r },
                { upsert: true }
            );
        }

        // 2. Analyze QL Drops
        const qlTranscripts = await getQLDropTranscripts(client_id);
        const qlReasons = await conversationReasoning.analyzeQLDrops(qlTranscripts);

        for (const r of qlReasons) {
            await WhyQLDrop.findOneAndUpdate(
                { client_id, date: today, reason: r.reason },
                { ...r },
                { upsert: true }
            );
        }

        // 3. Analyze Booking Drops
        const bookingJourneys = await getBookingDropJourneys(client_id);
        const bookingReasons = await conversationReasoning.analyzeBookingDrops(bookingJourneys);

        for (const r of bookingReasons) {
            await WhyBookingDrop.findOneAndUpdate(
                { client_id, date: today, reason: r.reason },
                { ...r },
                { upsert: true }
            );
        }

        res.json({ msg: "Analysis complete", botReasons, qlReasons, bookingReasons });

    } catch (error) {
        console.error("Analysis Run Failed", error);
        res.status(500).send("Analysis Failed");
    }
};

exports.getDeterminations = async (req, res) => {
    const { client_id } = req.query;
    const { date } = req.query; // Optional

    try {
        const query = { client_id };
        if (date) query.date = date;

        const [bot, ql, booking] = await Promise.all([
            WhyBotDrop.find(query),
            WhyQLDrop.find(query),
            WhyBookingDrop.find(query)
        ]);

        const ChatInsight = require('../models/ChatInsight');
        // Fetch simplified chat insights
        const chatInsights = await ChatInsight.find(query).limit(50).sort({ analyzed_at: -1 });

        res.json({
            why_bot_drop: bot,
            why_ql_drop: ql,
            why_booking_drop: booking,
            chat_insights: chatInsights
        });
    } catch (error) {
        console.error("Fetch Determinations Failed", error);
        res.status(500).send("Fetch Failed");
    }
};
