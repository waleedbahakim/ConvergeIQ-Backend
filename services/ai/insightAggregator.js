const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const ChatInsight = require('../../models/ChatInsight');
const chatReasoning = require('./chatReasoning');

exports.processClosedConversations = async (client_id) => {
    try {
        console.log(`[Aggregator] Processing closed conversations for ${client_id}...`);

        // 1. Find closed conversations without insights
        // In reality, we'd check if insight exists. Simplified logic:
        const closedConvs = await Conversation.find({
            client_id,
            status: { $in: ['resolved', 'closed', 'timeout'] }
            // Add check: _id not in ChatInsight.conversation_id
        }).limit(10); // Batch size

        for (const conv of closedConvs) {
            // Check if already analyzed
            const existing = await ChatInsight.findOne({ conversation_id: conv._id });
            if (existing) continue;

            // 2. Fetch full transcript
            const messages = await Message.find({ conversation_id: conv._id }).sort({ timestamp: 1 });
            const transcript = messages.map(m => `${m.sender_type}: ${m.text}`).join('\n');

            // 3. Analyze
            const analysis = await chatReasoning.analyzeCompletedConversation(transcript);

            if (analysis) {
                // 4. Store Insight
                await ChatInsight.create({
                    client_id,
                    conversation_id: conv._id,
                    outcome: analysis.outcome,
                    drop_reason: analysis.dropReason,
                    primary_intent: analysis.primaryIntent,
                    sentiment: analysis.sentiment,
                    suggested_action: analysis.suggestedAction,
                    confidence: analysis.confidence,
                    key_phrases: analysis.keyPhrases
                });
                console.log(`[Aggregator] Analyzed conversation ${conv.external_id}`);
            }
        }

    } catch (error) {
        console.error("Aggregation Failed:", error);
    }
};
