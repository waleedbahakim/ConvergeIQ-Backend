class BaseConnector {
    constructor(credentials) {
        this.credentials = credentials;
    }

    /**
     * Fetch leads from the CRM/Bot provider
     * @param {Object} params - Query parameters (startDate, endDate, etc.)
     * @returns {Promise<Array>} - List of leads
     */
    async fetchLeads(params) {
        throw new Error('fetchLeads must be implemented');
    }

    /**
     * Fetch interaction events
     * @param {Object} params - Query parameters
     * @returns {Promise<Array>} - List of events
     */
    async fetchEvents(params) {
        throw new Error('fetchEvents must be implemented');
    }

    /**
     * Validate connector credentials
     * @returns {Promise<boolean>}
     */
    async validate() {
        throw new Error('validate must be implemented');
    }
}

module.exports = BaseConnector;
