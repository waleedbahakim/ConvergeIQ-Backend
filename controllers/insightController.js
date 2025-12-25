const DailyFunnelMetric = require('../models/DailyFunnelMetric');
const aiService = require('../services/aiService');

exports.getInsights = async (req, res) => {
    const { client_id } = req.query; // Or from auth
    const date = req.query.date || new Date().toISOString().split('T')[0];

    try {
        // Fetch current day metrics
        const currentMetric = await DailyFunnelMetric.findOne({ client_id, date });

        // Fetch previous day for comparison
        const previousDate = new Date(date);
        previousDate.setDate(previousDate.getDate() - 1);
        const prevDateStr = previousDate.toISOString().split('T')[0];
        const prevMetric = await DailyFunnelMetric.findOne({ client_id, date: prevDateStr });

        if (!currentMetric) {
            return res.json([{ title: "No Data", description: "No metrics found for today to analyze.", type: "neutral" }]);
        }

        // Generate AI insights
        const insights = await aiService.generateDailyInsights(currentMetric, prevMetric);

        res.json(insights);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
