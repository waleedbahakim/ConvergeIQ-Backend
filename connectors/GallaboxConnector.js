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

    async fetchConversations(days = 1) {
        try {
            // Calculate timestamps
            const toDate = new Date();
            const fromDate = new Date();
            fromDate.setDate(toDate.getDate() - days);

            // Convert to UNIX timestamp if API requires, or ISO. Gallabox usually prefers ISO or explicit params.
            // Using standard params based on typical integration
            const params = {
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
                limit: 100
            };

            const response = await axios.get(`${this.baseUrl}/conversations`, {
                headers: this.headers,
                params
            });
            return response.data;
        } catch (error) {
            console.error('[Gallabox] Fetch Conversations Failed:', error.response?.data || error.message);
            return [];
        }
    }

    async fetchMessages(conversationId) {
        try {
            const response = await axios.get(`${this.baseUrl}/conversations/${conversationId}/messages`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error(`[Gallabox] Fetch Messages Failed for ${conversationId}:`, error.response?.data || error.message);
            return [];
        }
    }
}

module.exports = GallaboxConnector;
