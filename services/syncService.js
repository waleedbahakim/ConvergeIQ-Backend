const Lead = require('../models/Lead');
const Event = require('../models/Event');
const Client = require('../models/Client');
// In a real app, we'd import the Connectors to fetch from LSQ/Gallabox API
// const lsqConnector = require('../connectors/LeadSquaredConnector');
// const gallaboxConnector = require('../connectors/GallaboxConnector');

exports.syncLeads = async (client_id, days = 14) => {
    console.log(`[Sync] Syncing Leads for ${client_id} for last ${days} days...`);
    // Mock implementation
    // 1. Fetch from LSQ (modified in last X days)
    // 2. Upsert to DB
    console.log(`[Sync] Leads Synced Successfully.`);
};

exports.syncBotHistory = async (client_id, days = 14) => {
    console.log(`[Sync] Syncing Bot History for ${client_id} for last ${days} days...`);

    // In real app, we would fetch credentials from Client model
    // const client = await Client.findById(client_id);
    // const connector = new GallaboxConnector(client);

    // Mocking for MVP
    const GallaboxConnector = require('../connectors/GallaboxConnector');
    const connector = new GallaboxConnector({ api_credentials: { bot_api_key: 'mock' } });

    const conversations = await connector.fetchConversations(); // Params would go here

    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');

    for (const conv of conversations) {
        // Upsert Conversation
        let dbConv = await Conversation.findOneAndUpdate(
            { client_id, external_id: conv.id },
            {
                status: conv.status,
                created_at: conv.created_at,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );

        // Fetch Messages
        const messages = await connector.fetchMessages(conv.id);
        for (const msg of messages) {
            await Message.findOneAndUpdate(
                { client_id, external_id: msg.id },
                {
                    conversation_id: dbConv._id,
                    text: msg.text,
                    sender_type: msg.sender.type, // 'bot' or 'user'
                    timestamp: msg.timestamp
                },
                { upsert: true }
            );
        }
    }

    console.log(`[Sync] Bot History Synced Successfully (${conversations.length} conversations).`);
};

exports.reconcile = async (client_id) => {
    console.log(`[Reconcile] Running Nightly Reconciliation for ${client_id}...`);
    // Mock: Compare counts, fetch missing
    console.log(`[Reconcile] Reconciliation Complete.`);
};
