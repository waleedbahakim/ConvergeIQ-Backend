const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
}

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.analyzeQLDrops = async (transcripts) => {
    try {
        if (!transcripts || transcripts.length === 0) return [];

        const prompt = `
        Analyze these chat transcripts where the user interacted but did NOT become a Qualified Lead (QL).
        Cluster the reasons for dropping off.

        Transcripts:
        ${JSON.stringify(transcripts)}

        Common Reasons to look for:
        - Budget mismatch
        - Location mismatch
        - Just browsing
        - Trust concerns
        
        Return structured analysis.
        `;

        const response = await client.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            reason: { type: "string" },
                            drop_rate: { type: "string", description: "Percentage string e.g., '38%'" },
                            keywords: { type: "array", items: { type: "string" } },
                            recommendation: { type: "string" }
                        },
                        required: ["reason", "drop_rate", "keywords", "recommendation"]
                    }
                }
            }
        });

        return JSON.parse(response.text());

    } catch (error) {
        console.error("QL Drop Analysis Failed:", error);
        return [];
    }
};

exports.analyzeBookingDrops = async (leadJourneys) => {
    try {
        if (!leadJourneys || leadJourneys.length === 0) return [];

        const prompt = `
        Analyze these Qualified Leads (QL) who did NOT book an appointment.
        Find the root cause.

        Lead Journeys (Timeline of events):
        ${JSON.stringify(leadJourneys)}

        Look for:
        - Follow-up delays
        - Price shock after QL
        - Agent behavior
        
        Return structured analysis.
        `;

        const response = await client.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            reason: { type: "string" },
                            count: { type: "number" },
                            booking_loss_rate: { type: "string", description: "Percentage string e.g., '31%'" },
                            recommendation: { type: "string" }
                        },
                        required: ["reason", "count", "booking_loss_rate", "recommendation"]
                    }
                }
            }
        });

        return JSON.parse(response.text());

    } catch (error) {
        console.error("Booking Drop Analysis Failed:", error);
        return [];
    }
};
