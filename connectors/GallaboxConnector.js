const BaseConnector = require('./BaseConnector');
const axios = require('axios');

class GallaboxConnector extends BaseConnector {
    constructor(config) {
        super(config);
        this.baseUrl = 'https://api.gallabox.com/v1'; // Verify actual base URL
        this.apiKey = config.api_credentials?.bot_api_key;
        this.apiSecret = config.api_credentials?.bot_api_secret; // Or however they auth

        // Gallabox typically uses apiKey/apiSecret headers
        this.headers = {
            'apiKey': this.apiKey,
            'apiSecret': this.apiSecret,
            'Content-Type': 'application/json'
        };
    }

    async fetchConversations(from, to) {
        // Mocking the implementation as we don't have real Keys
        console.log(`[Gallabox] Fetching conversations from ${from} to ${to}`);
        // In real impl:
        // const response = await axios.get(`${this.baseUrl}/conversations`, { headers: this.headers, params: { from, to } });
        // return response.data;

        return [
            { id: 'conv_123', status: 'open', created_at: new Date().toISOString() },
            { id: 'conv_456', status: 'resolved', created_at: new Date().toISOString() }
        ];
    }

    async fetchMessages(conversationId) {
        console.log(`[Gallabox] Fetching messages for ${conversationId}`);
        // In real impl:
        // const response = await axios.get(`${this.baseUrl}/conversations/${conversationId}/messages`, { headers: this.headers });
        // return response.data;

        return [
            { id: 'msg_1', type: 'text', sender: { type: 'bot' }, text: 'Hello!', timestamp: new Date() },
            { id: 'msg_2', type: 'text', sender: { type: 'user' }, text: 'Hi price?', timestamp: new Date() }
        ];
    }
}

module.exports = GallaboxConnector;
