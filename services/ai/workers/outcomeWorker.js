const aiService = require('../aiService');
const ChatInsight = require('../../../models/ChatInsight');
const Message = require('../../../models/Message');
const Conversation = require('../../../models/Conversation');
const eventBus = require('../../eventBus');

exports.analyze = async ({ client_id, lead_id, conversation_id }) => {
    try {
        console.log(`[Worker] OutcomeWorker: Analyzing Conv ${conversation_id} (Lead: ${lead_id})...`);

        // 1. Fetch Transcript
        // If conversation_id is missing but we have lead_id, try to find the active conversation
        if (!conversation_id && lead_id) {
            const conv = await Conversation.findOne({ lead_id }).sort({ updated_at: -1 });
            if (conv) conversation_id = conv._id;
        }

        if (!conversation_id) {
            console.warn('[Worker] OutcomeWorker: No conversation found to analyze.');
            return;
        }

        const messages = await Message.find({ conversation_id }).sort({ timestamp: 1 });
        if (messages.length === 0) return;

        const transcript = messages.map(m => `${m.sender_type}: ${m.text}`).join('\n');

        // 2. AI Analysis
        const analysis = await aiService.analyzeConversationOutcome(transcript);

        if (analysis) {
            // 3. Save to ChatInsight
            // Reuse existing ChatInsight model but populate new fields
            // Assuming ChatInsight schema covers these, or rely on flexible schema?
            // The user wanted us to reuse ChatInsight. The original schema had:
            // outcome, drop_reason, primary_intent, sentiment.

            await ChatInsight.findOneAndUpdate(
                { conversation_id },
                {
                    client_id,
                    outcome: analysis.outcome,
                    drop_reason: analysis.drop_reason,
                    primary_intent: analysis.primary_intent,
                    sentiment: analysis.sentiment,
                    analyzed_at: new Date()
                },
                { upsert: true, new: true }
            );

            console.log(`[Worker] OutcomeWorker: Analysis Saved. Outcome: ${analysis.outcome}`);

            // 4. Emit Update Event (to trigger Aggregation if real-time)
            eventBus.emitEvent(eventBus.events.AI_INSIGHT_UPDATED, { client_id, type: 'outcome_analysis' });
        }

    } catch (error) {
        console.error("[Worker] OutcomeWorker Error:", error);
    }
};
