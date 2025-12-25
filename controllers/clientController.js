const Client = require('../models/Client');

exports.createClient = async (req, res) => {
    try {
        const { client_id, name, crm_provider, bot_provider } = req.body;
        let client = await Client.findOne({ client_id });
        if (client) return res.status(400).json({ msg: 'Client already exists' });

        client = new Client({ client_id, name, crm_provider, bot_provider });
        await client.save();
        res.json(client);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find({});
        res.json(clients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}
