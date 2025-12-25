const eventBus = require('../eventBus');

const botFailureWorker = require('./workers/botFailureWorker');
const chatRiskWorker = require('./workers/chatRiskWorker');
const outcomeWorker = require('./workers/outcomeWorker');

const init = () => {
    console.log('[AIRouter] 🧠 Initializing AI Event Router...');

    eventBus.on(eventBus.events.LEAD_CREATED, async (payload) => {
        console.log('[AIRouter] Received LEAD_CREATED. Scheduling Bot Trigger Analysis...');
        // In prod, use a queue (Bull/RabbitMQ) with delay. Here: simple timeout
        setTimeout(() => botFailureWorker.analyze(payload), 5000);
    });

    eventBus.on(eventBus.events.LEAD_STAGE_CHANGED, async (payload) => {
        console.log(`[AIRouter] Received LEAD_STAGE_CHANGED to ${payload.new_stage}. Triggering Outcome Analysis...`);
        // Trigger outcome analysis for every stage change to track intent evolution, 
        // or specifically for 'Dropped' / 'Booking' / 'Won'
        outcomeWorker.analyze({
            client_id: payload.client_id,
            lead_id: payload.lead._id
        });
    });

    eventBus.on(eventBus.events.CHAT_MESSAGE_RECEIVED, async (payload) => {
        // Only analyze user messages for risk
        if (payload.message.sender_type === 'user') {
            chatRiskWorker.analyze(payload);
        }
    });

    eventBus.on(eventBus.events.CONVERSATION_CLOSED, async (payload) => {
        console.log('[AIRouter] Received CONVERSATION_CLOSED. Running Post-Mortem...');
    });

    eventBus.on(eventBus.events.NIGHTLY_RECONCILE, async (payload) => {
        console.log('[AIRouter] Received NIGHTLY_RECONCILE. Self-healing...');
    });
};

module.exports = { init };
