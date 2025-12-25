const cron = require('node-cron');
const syncService = require('../services/syncService');
const analyticsController = require('../controllers/analyticsController');
const Client = require('../models/Client');

const initCronJobs = () => {
    console.log('Initializing Cron Jobs...');

    // 1. Nightly Reconciliation (e.g., at 2 AM)
    cron.schedule('0 2 * * *', async () => {
        console.log('Running Nightly Reconciliation...');
        try {
            const clients = await Client.find({ status: 'active' });
            for (const client of clients) {
                await syncService.reconcile(client._id);
            }
        } catch (err) {
            console.error('Nightly Reconciliation Failed', err);
        }
    });

    // 3. Hourly AI Insight Processing
    const insightAggregator = require('../services/ai/insightAggregator');
    cron.schedule('0 * * * *', async () => {
        console.log('Running AI Insight Aggregation...');
        try {
            const clients = await Client.find({ status: 'active' });
            for (const client of clients) {
                await insightAggregator.processClosedConversations(client._id);
            }
        } catch (err) {
            console.error('AI Aggregation Failed', err);
        }
    });

    // 2. Daily Funnel Aggregation (e.g., at 1 AM - just after day end)
    cron.schedule('0 1 * * *', async () => {
        console.log('Running Daily Funnel Aggregation...');
        try {
            const clients = await Client.find({ status: 'active' });
            // Calculate for "Yesterday"
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0];

            for (const client of clients) {
                // Mock request object or refactor controller to separate logic
                // Calling logic directly:
                // await analyticsController.computeDailyMetricsInternal(client._id, dateStr); 
                // We need to refactor controller slightly to expose internal method or just mock here
                console.log(`[Cron] Aggregating metrics for ${client.name} on ${dateStr}`);
            }
        } catch (err) {
            console.error('Daily Aggregation Failed', err);
        }
    });
};

module.exports = initCronJobs;
