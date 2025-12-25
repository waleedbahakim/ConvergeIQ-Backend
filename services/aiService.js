const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
}

// Initialize Gemini Client
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateDailyInsights = async (metrics, previousMetrics) => {
    try {
        const prompt = `
        Analyze the following daily business funnel metrics for a client and generate 3 key insights.
        
        Current Day Metrics:
        ${JSON.stringify(metrics, null, 2)}

        Previous Day Metrics:
        ${JSON.stringify(previousMetrics || {}, null, 2)}

        Focus on:
        1. Drop-offs in the funnel (Leads -> Bot Triggered -> Interacted -> QL -> Booking).
        2. Significant changes compared to the previous day.
        3. Anomalies (e.g., high leads but low interaction).
        `;

        const response = await client.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            type: {
                                type: "string",
                                enum: ["positive", "negative", "neutral"]
                            }
                        },
                        required: ["title", "description", "type"]
                    }
                }
            }
        });

        return JSON.parse(response.text());

    } catch (error) {
        console.error("Gemini Insight Generation Failed:", error);
        return [
            { title: "Analysis Failed", description: "Detailed analysis unavailable.", type: "neutral" }
        ];
    }
};
