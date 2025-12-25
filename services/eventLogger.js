const eventBus = require('./eventBus');
const Event = require('../models/Event');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');

const init = () => {
    console.log('[EventLogger] 🟢 Initializing Unified Event Logger...');

    // 1. Handle Lead Creation
    eventBus.on(eventBus.events.LEAD_CREATED, async ({ client_id, lead }) => {
        try {
            await Event.create({
                client_id,
                lead_id: lead._id,
                type: 'lead_created',
                timestamp: new Date(),
                data: {
                    raw_event: 'LeadCreated',
                    new_stage: lead.stage,
                    details: lead
                }
            });
            console.log(`[EventLogger] 📝 Logged lead_created for ${lead._id}`);
        } catch (err) {
            console.error('[EventLogger] Failed to log LEAD_CREATED:', err);
        }
    });

    // 2. Handle Stage Changes (MQL, SQL, Booking, etc.)
    eventBus.on(eventBus.events.LEAD_STAGE_CHANGED, async ({ client_id, lead, old_stage, new_stage }) => {
        try {
            let type = 'stage_change';
            const stageLower = new_stage?.toLowerCase() || '';

            // Map stages to specific Event types for analytics
            if (stageLower.includes('booking') || stageLower === 'won') {
                type = 'booking';
            } else if (stageLower.includes('site visit') && stageLower.includes('done')) {
                type = 'site_visit_done';
            } else if (stageLower.includes('site visit') || stageLower.includes('scheduled')) {
                type = 'site_visit_scheduled';
            } else if (stageLower === 'prebooking' || stageLower === 'pre-booking') {
                type = 'prebooking';
            } else if (stageLower === 'direct booking') {
                type = 'direct_booking';
            } else if (stageLower === 'mql') { // Explicit MQL stage check
                type = 'stage_change'; // Keep generic but ensure data.new_stage is correct
                // Actually, for MQL/SQL counts, the controller looks for type='stage_change' AND data.new_stage='MQL'
                // So type 'stage_change' is fine.
            }

            await Event.create({
                client_id,
                lead_id: lead._id,
                type: type,
                timestamp: new Date(),
                data: {
                    old_stage,
                    new_stage, // Critical for Analytics Controller
                    details: lead
                }
            });
            console.log(`[EventLogger] 📝 Logged ${type} (Stage: ${new_stage}) for ${lead._id}`);

        } catch (err) {
            console.error('[EventLogger] Failed to log LEAD_STAGE_CHANGED:', err);
        }
    });

    // 3. Handle Chat Messages (Bot Sent / User Replied)
    eventBus.on(eventBus.events.CHAT_MESSAGE_RECEIVED, async ({ client_id, message, conversation_id }) => {
        try {
            // We need lead_id. Check Conversation first.
            let leadId = null;
            const conversation = await Conversation.findOne({ _id: conversation_id });

            if (conversation?.lead_id) {
                leadId = conversation.lead_id;
            } else {
                // Try to resolve Lead by Phone
                // Message might not have phone, but Conversation or Message meta might
                // Standardizing: Gallabox payload usually has phone in meta
                const phone = message.meta?.sender?.phone || message.meta?.wa_id || message.meta?.body?.wanumber;

                if (phone) {
                    const lead = await Lead.findOne({ client_id, phone }); // Simple match
                    if (lead) {
                        leadId = lead._id;
                        // Self-Heal: Update Conversation
                        await Conversation.updateOne({ _id: conversation_id }, { lead_id: lead._id });
                        console.log(`[EventLogger] 🔗 Linked Conversation ${conversation_id} to Lead ${lead._id}`);
                    }
                }
            }

            let eventType = 'bot_sent';
            if (message.sender_type === 'user') {
                eventType = 'user_replied';
            }

            await Event.create({
                client_id,
                lead_id: leadId, // Might be null if unlinked, but we log the activity anyway
                type: eventType,
                timestamp: message.timestamp || new Date(),
                data: {
                    message_id: message._id,
                    text: message.text,
                    conversation_id
                }
            });
            // console.log(`[EventLogger] 📝 Logged ${eventType}`);

        } catch (err) {
            console.error('[EventLogger] Failed to log CHAT_MESSAGE_RECEIVED:', err);
        }
    });
};

module.exports = { init };
