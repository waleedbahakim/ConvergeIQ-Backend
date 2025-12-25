const Lead = require('../models/Lead');
const Event = require('../models/Event');
const Client = require('../models/Client');
// In a real app, we'd import the Connectors to fetch from LSQ/Gallabox API
// const lsqConnector = require('../connectors/LeadSquaredConnector');
// const gallaboxConnector = require('../connectors/GallaboxConnector');

const eventBus = require('./eventBus');

// Fetch only previous day data by default
exports.syncLeads = async (client_id, days = 1) => {
    console.log(`[Sync] Syncing Leads for ${client_id} for last ${days} day(s)...`);

    try {
        // Retrieve Client Configuration
        const client = await Client.findById(client_id);
        if (!client) {
            console.error(`[Sync] Client ${client_id} not found.`);
            return;
        }

        const LeadSquaredConnector = require('../connectors/LeadSquaredConnector');
        const lsqConnector = new LeadSquaredConnector(client); // client object has api_credentials

        const leads = await lsqConnector.fetchLeads(days);

        if (leads && Array.isArray(leads)) {
            for (const leadData of leads) {
                const external_id = leadData.ProspectID || leadData.id; // LSQ uses ProspectID
                if (!external_id) continue;

                // Check existence
                const existing = await Lead.findOne({ client_id, external_id });
                const isNew = !existing;
                const originalStage = existing?.stage;
                const currentStage = leadData.Stage || 'New';

                // Upsert
                const lead = await Lead.findOneAndUpdate(
                    { client_id, external_id },
                    {
                        name: `${leadData.FirstName || ''} ${leadData.LastName || ''}`.trim(),
                        email: leadData.EmailAddress || '',
                        phone: leadData.Phone || '',
                        stage: currentStage,
                        custom_data: leadData,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                // Emit Intelligence Events
                if (isNew) {
                    eventBus.emitEvent(eventBus.events.LEAD_CREATED, { client_id, lead });
                } else if (originalStage !== lead.stage) {
                    eventBus.emitEvent(eventBus.events.LEAD_STAGE_CHANGED, {
                        client_id,
                        lead,
                        old_stage: originalStage,
                        new_stage: lead.stage
                    });
                }
                // Could act on LEAD_UPDATED if needed, but reducing noise
            }
        }

    } catch (error) {
        console.error(`[Sync] Lead Sync Failed:`, error);
    }

    console.log(`[Sync] Lead Sync Logic Execution Completed.`);
};

exports.syncBotHistory = async (client_id, days = 1) => {
    console.log(`[Sync] Syncing Bot History for ${client_id} for last ${days} day(s)...`);

    const GallaboxConnector = require('../connectors/GallaboxConnector');
    const connector = new GallaboxConnector({ api_credentials: { bot_api_key: 'mock' } });

    // In real implementation: Pass start/end date for "Yesterday"
    const conversations = await connector.fetchConversations(days);

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

        // Note: For conversations, we might want to emit CONVERSATION_CLOSED if status changed to 'closed'
        // But for MVP, focusing on messages for Chat Risk AI

        // Fetch Messages
        const messages = await connector.fetchMessages(conv.id);
        for (const msg of messages) {
            // Check if exists first to know if we should emit event
            const existingMsg = await Message.findOne({ client_id, external_id: msg.id });

            if (!existingMsg) {
                const newMsg = await Message.create({
                    client_id,
                    conversation_id: dbConv._id,
                    external_id: msg.id,
                    text: msg.text,
                    sender_type: msg.sender.type, // 'bot' or 'user'
                    timestamp: msg.timestamp
                });

                // EMIT EVENT: Triggers Real-time Risk AI (if user message)
                eventBus.emitEvent(eventBus.events.CHAT_MESSAGE_RECEIVED, {
                    client_id,
                    message: newMsg,
                    conversation_id: dbConv._id
                });
            }
        }
    }

    console.log(`[Sync] Bot History Synced and Events Emitted.`);
};

exports.reconcile = async (client_id) => {
    console.log(`[Reconcile] Running Nightly Reconciliation for ${client_id} (Previous Day Data)...`);

    // Explicitly sync yesterday's data
    await exports.syncLeads(client_id, 1);
    await exports.syncBotHistory(client_id, 1);

    // Emit event for Self-Healing AI to run on this batch
    eventBus.emitEvent(eventBus.events.NIGHTLY_RECONCILE, { client_id, days: 1 });

    console.log(`[Reconcile] Reconciliation Complete.`);
};
