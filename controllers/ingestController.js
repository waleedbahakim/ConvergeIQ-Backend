const Client = require('../models/Client');
const Lead = require('../models/Lead');
const Event = require('../models/Event');
const LeadSquaredConnector = require('../connectors/LeadSquaredConnector');
const GallaboxConnector = require('../connectors/GallaboxConnector');

// Factory to get connector instance
const getConnector = (client, type) => {
    // secure access to credentials in production
    const credentials = client.api_credentials;
    if (type === 'crm') {
        if (client.crm_provider === 'LeadSquared') return new LeadSquaredConnector(credentials);
        // Add others
    } else if (type === 'bot') {
        if (client.bot_provider === 'Gallabox') return new GallaboxConnector(credentials);
        // Add others
    }
    return null;
};

exports.triggerIngestion = async (req, res) => {
    const { client_id } = req.body; // Internal Client DB ID
    const { startDate, endDate } = req.body;

    try {
        const client = await Client.findById(client_id);
        if (!client) return res.status(404).json({ msg: 'Client not found' });

        const results = {
            leadsProcessed: 0,
            eventsProcessed: 0
        };

        // 1. Ingest Leads
        const crmConnector = getConnector(client, 'crm');
        if (crmConnector) {
            const leads = await crmConnector.fetchLeads({ startDate, endDate });
            for (const item of leads) {
                // Upsert Lead
                await Lead.findOneAndUpdate(
                    { client_id: client._id, external_id: item.id },
                    {
                        name: item.name,
                        email: item.email,
                        custom_data: item,
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                results.leadsProcessed++;
            }
        }

        // 2. Ingest Events
        const botConnector = getConnector(client, 'bot');
        if (botConnector) {
            const events = await botConnector.fetchEvents({ startDate, endDate });
            for (const evt of events) {
                // Just create new events for now (deduplication logic might be needed later)
                // Assuming we can link to a lead if external_user_id is present
                // For MVP, just storing raw event
                const newEvent = new Event({
                    client_id: client._id,
                    type: evt.type, // Map 'message_sent' -> schema enum if needed
                    timestamp: evt.timestamp,
                    data: evt
                });
                await newEvent.save();
                results.eventsProcessed++;
            }
        }

        res.json({ msg: 'Ingestion completed', results });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
};
