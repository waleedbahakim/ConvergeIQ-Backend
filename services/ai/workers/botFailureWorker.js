const operationalReasoning = require('../../reasoning/operationalReasoning');
const WhyBotDrop = require('../../../models/analytics/WhyBotDrop');

exports.analyze = async ({ client_id, lead }) => {
    try {
        console.log(`[Worker] BotFailureWorker: Analyzing Lead ${lead._id} for trigger failure...`);

        // Simulating a delay check: Did the bot trigger X minutes after lead creation?
        // For MVP, we run the reasoning immediately assuming if we are called, we suspect a fail
        // In real system, we'd query Events to see if 'bot_sent' exists

        const events = []; // Fetch real events
        const reasoning = await operationalReasoning.analyzeBotDrops([{ lead, events }]);

        if (reasoning && reasoning.length > 0) {
            const prediction = reasoning[0];
            // Store Insight
            await WhyBotDrop.findOneAndUpdate(
                { lead_id: lead._id }, // Assuming schema allows unique per lead or date
                {
                    client_id,
                    reason: prediction.reason,
                    impact: prediction.impact,
                    recommendation: prediction.recommendation,
                    count: 1
                },
                { upsert: true }
            );
            console.log(`[Worker] BotFailureWorker: Insight Saved: ${prediction.reason}`);

            const eventBus = require('../../eventBus');
            eventBus.emitEvent(eventBus.events.AI_INSIGHT_UPDATED, { client_id, type: 'bot_failure' });
        }
    } catch (error) {
        console.error("[Worker] BotFailureWorker Error:", error);
    }
};
