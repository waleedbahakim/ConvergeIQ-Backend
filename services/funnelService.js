const eventBus = require('./eventBus');
const analyticsController = require('../controllers/analyticsController');

const init = () => {
    console.log('[FunnelService] 🔄 Initializing Autonomous Feedback Loop...');

    eventBus.on(eventBus.events.AI_INSIGHT_UPDATED, async ({ client_id, type }) => {
        console.log(`[FunnelService] Insight Updated (${type}). Recomputing metrics for client ${client_id}...`);

        // Immediate Recompute of today's metrics
        const today = new Date().toISOString().split('T')[0];

        try {
            // Execute internal logic to recompute metrics
            await analyticsController.computeDailyMetricsInternal(client_id, today);

            console.log(`[FunnelService] ✅ Metrics recomputed for ${client_id} (Date: ${today})`);
        } catch (error) {
            console.error('[FunnelService] Recompute Failed:', error);
        }
    });
};

module.exports = { init };
