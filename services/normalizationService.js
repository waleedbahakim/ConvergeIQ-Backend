const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

exports.normalizeAndSave = async (client_id, payload) => {
    try {
        // Gallabox payloads vary by event type (message vs conversation)
        // This is a simplified normalization logic

        // 1. Identification
        const conversationId = payload.conversation_id || payload.body?.conversation_id;
        const messageId = payload.message_id || payload.body?.message_id || payload.id;
        const text = payload.text?.body || payload.body?.text?.body || "";
        const senderType = payload.sender?.type === 'customer' ? 'user' : 'bot'; // Adjust mapping
        const timestamp = payload.timestamp ? new Date(payload.timestamp * 1000) : new Date();

        if (!conversationId || !messageId) {
            console.warn("Skipping normalization: Missing IDs", payload);
            return null;
        }

        // 2. Ensure Conversation Exists (Upsert)
        let dbConv = await Conversation.findOneAndUpdate(
            { client_id, external_id: conversationId },
            {
                updated_at: new Date(),
                // If new, set defaults
                $setOnInsert: { status: 'active', created_at: new Date() }
            },
            { upsert: true, new: true }
        );

        // 3. Save Message
        const dbMsg = await Message.findOneAndUpdate(
            { client_id, external_id: messageId },
            {
                conversation_id: dbConv._id,
                sender_type: senderType,
                text: text,
                timestamp: timestamp,
                meta: payload
            },
            { upsert: true, new: true }
        );

        return dbMsg;

    } catch (error) {
        console.error("Normalization Error:", error);
        return null;
    }
};
