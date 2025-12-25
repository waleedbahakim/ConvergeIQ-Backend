const chatReasoning = require('../chatReasoning');

exports.analyze = async ({ client_id, message, conversation_id }) => {
    try {
        // 1. Fetch recent context (last 5 msgs)
        const Message = require('../../../models/Message');
        const recent = await Message.find({ conversation_id }).sort({ timestamp: -1 }).limit(5);
        const transcript = recent.reverse().map(m => `${m.sender_type}: ${m.text}`).join('\n');

        // 2. AI Reasoning
        const result = await chatReasoning.analyzeRealTimeRisk(transcript);

        if (result && result.riskScore > 50) {
            console.log(`[Worker] ChatRiskWorker: High Risk Detected (${result.riskScore}) on conv ${conversation_id}`);
            // Could emit an alert or store in high-priority queue
            // For now, just log or update Conversation status

            const eventBus = require('../../eventBus');
            eventBus.emitEvent(eventBus.events.AI_INSIGHT_UPDATED, { client_id, type: 'chat_risk', data: result });
        }

    } catch (error) {
        console.error("[Worker] ChatRiskWorker Error:", error);
    }
};
