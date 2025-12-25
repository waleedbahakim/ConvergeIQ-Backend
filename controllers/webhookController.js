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

const eventBus = require('../services/eventBus');

exports.leadSquaredWebhook = async (req, res) => {
    const { client_id } = req.params;
    try {
        const client = await Client.findById(client_id);
        if (!client) return res.status(404).send('Client not found');

        // LSQ typically passes Metadata in Query, Data in Body
        // e.g. ?eventType=LeadCreated&entityId=...
        const { eventType, entityId } = req.query;
        const bodyDate = req.body; // The Lead JSON

        // Fallback: Check body if query is empty (some configs differ)
        const finalEventType = eventType || bodyDate.EventType;
        const external_id = entityId || bodyDate.EntityId || bodyDate.Data?.Id; // Data.Id often used for ProspectID

        // Define Data object correctly
        // If bodyDate has 'Data' key, use it, else assume bodyDate IS the data
        const Data = bodyDate.Data || bodyDate;

        // 1. Upsert Lead
        if (external_id) {
            // Check if exists to determine if Created or Updated
            const existing = await Lead.findOne({ client_id, external_id });
            const isNew = !existing;
            const originalStage = existing?.stage;

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

            if (isNew) {
                eventBus.emitEvent(eventBus.events.LEAD_CREATED, { client_id, lead });
            } else if (originalStage !== lead.stage) {
                eventBus.emitEvent(eventBus.events.LEAD_STAGE_CHANGED, {
                    client_id,
                    lead,
                    old_stage: originalStage,
                    new_stage: lead.stage
                });
            } else {
                eventBus.emitEvent(eventBus.events.LEAD_UPDATED, { client_id, lead });
            }
        }

        // 2. Log Event - HANDLED BY EVENT LOGGER via eventBus


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

        // 2. Legacy Event Logging - HANDLED BY EVENT LOGGER via eventBus
        /*
        const phone = payload?.sender?.phone || payload?.body?.wanumber;
        ...
        */

        res.status(200).send('Processed');

    } catch (error) {
        console.error("Gallabox Webhook Error", error);
        res.status(500).send('Server Error');
    }
};
