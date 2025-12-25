const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.events = {
            LEAD_CREATED: 'LEAD_CREATED',
            LEAD_UPDATED: 'LEAD_UPDATED',
            LEAD_STAGE_CHANGED: 'LEAD_STAGE_CHANGED',
            CHAT_MESSAGE_RECEIVED: 'CHAT_MESSAGE_RECEIVED',
            CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
            NIGHTLY_RECONCILE: 'NIGHTLY_RECONCILE',
            AI_INSIGHT_UPDATED: 'AI_INSIGHT_UPDATED'
        };
    }

    emitEvent(type, payload) {
        // Basic logging, can be enhanced with structured logging
        console.log(`[EventBus] 📡 ${type} emitted for Client: ${payload?.client_id || 'Unknown'}`);
        this.emit(type, payload);
    }
}

module.exports = new EventBus();
