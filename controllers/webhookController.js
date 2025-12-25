const crypto = require('crypto');
const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Event = require('../models/Event');
const normalizationService = require('../services/normalizationService');

// Helper to validate secret
const validateSecret = (req, client) => {
    const token = req.headers['x-webhook-secret'] || req.query.secret;
    if (!token || token !== client.api_credentials.webhook_secret) {
        return false;
    }
    return true;
};

exports.leadSquaredWebhook = async (req, res) => {
    const { client_id } = req.params;
    try {
        const client = await Client.findById(client_id);
        if (!client) return res.status(404).send('Client not found');

        const { EventType, EntityId, Data } = req.body;

        let lead;
        const external_id = EntityId || Data?.Id;

        // 1. Upsert Lead
        if (external_id) {
            lead = await Lead.findOneAndUpdate(
                { client_id, external_id },
                {
                    $set: {
                        name: Data?.FirstName + ' ' + Data?.LastName,
                        email: Data?.EmailAddress,
                        phone: Data?.Phone,
                        stage: Data?.Stage || 'New',
                        custom_data: Data
                    }
                },
                { upsert: true, new: true }
            );
        }

        // 2. Log Event
        if (lead) {
            let type = 'stage_change';
            if (EventType === 'LeadCreated') type = 'lead_created';

            await Event.create({
                client_id,
                lead_id: lead._id,
                type: 'stage_change',
                timestamp: new Date(),
                data: {
                    raw_event: EventType,
                    details: Data
                }
            });
        }

        res.status(200).send('Processed');

    } catch (error) {
        console.error("LSQ Webhook Error", error);
        res.status(500).send('Server Error');
    }
};

exports.gallaboxWebhook = async (req, res) => {
    const { client_id } = req.params;
    try {
        const client = await Client.findById(client_id);
        if (!client) return res.status(404).send('Client not found');

        const payload = req.body;
        const { type } = payload;

        // 1. Normalize & Store Chat (Real-time history)
        if (type === 'message' || type === 'message.created') {
            await normalizationService.normalizeAndSave(client_id, payload);
        }

        // 2. Legacy Event Logging (for Funnel)
        const phone = payload?.sender?.phone || payload?.body?.wanumber;
        let leadId = null;

        if (phone) {
            const lead = await Lead.findOne({ client_id, phone });
            if (lead) leadId = lead._id;
        }

        let eventType = 'bot_sent';
        if (type === 'message' && payload?.type === 'text') {
            eventType = 'user_replied';
        } else if (type === 'message_status') {
            eventType = 'bot_sent';
        }

        await Event.create({
            client_id,
            lead_id: leadId,
            type: eventType,
            timestamp: new Date(),
            data: payload
        });

        res.status(200).send('Processed');

    } catch (error) {
        console.error("Gallabox Webhook Error", error);
        res.status(500).send('Server Error');
    }
};
