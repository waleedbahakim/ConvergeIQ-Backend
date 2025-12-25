const axios = require('axios');

class LeadSquaredConnector extends BaseConnector {
    constructor(config) {
        super(config);
        // Default to a common base URL, or it can be passed in config
        this.baseUrl = config.baseUrl || 'https://api-in21.leadsquared.com/v2';
        this.accessKey = config.api_credentials?.lsq_access_key;
        this.secretKey = config.api_credentials?.lsq_secret_key;
    }

    async fetchLeads(days = 1) {
        try {
            console.log(`[LeadSquared] Fetching leads modified in last ${days} days`);

            // LeadSquared API typically uses POST to /LeadManagement.svc/Leads.Get or basic Search
            // Using a simplified search via modified on

            const toDate = new Date().toISOString();
            // LSQ expects formatted dates usually, but assuming standard ISO for this query stub or specific simple query
            // Actually, LSQ Advanced Search is robust.
            // Simplified: "Retrieve changes" API is often best, but for MVP we search by date.

            /* 
               Real implementation often involves POST /LeadManagement.svc/Leads.Get
               Body: { Parameter: { FromDate: ..., ToDate: ... } }
            */

            // Constructing a "Modified recently" query
            // LSQ 'Leads.Get' often requires YYYY-MM-DD HH:MM:SS format
            const formatDate = (date) => date.toISOString().replace('T', ' ').substring(0, 19);

            const response = await axios.post(`${this.baseUrl}/LeadManagement.svc/Leads.Get`, {
                Parameter: {
                    FromDate: formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
                    ToDate: formatDate(new Date())
                },
                Columns: {
                    Include_CSV: "EmailAddress,FirstName,LastName,Phone,Stage,mx_Custom_1"
                }
            }, {
                params: {
                    accessKey: this.accessKey,
                    secretKey: this.secretKey
                }
            });

            // Helper mapping to normalize response
            // LSQ response wrapped in { Dataset: [...] } presumably
            return response.data?.List || response.data || [];

        } catch (error) {
            console.error('[LeadSquared] Fetch Leads Failed:', error.response?.data || error.message);
            return [];
        }
    }

    async fetchEvents({ startDate, endDate }) {
        // Implement similarly if needed
        return [];
    }

    async validate() {
        return !!(this.accessKey && this.secretKey);
    }
}

module.exports = LeadSquaredConnector;
