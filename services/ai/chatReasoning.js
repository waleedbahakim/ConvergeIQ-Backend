const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
}

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.analyzeCompletedConversation = async (transcript) => {
    try {
        if (!transcript) return null;

        const prompt = `
        Analyze this completed conversation between a bot/agent and a user.
        Determine the Outcome, Drop Reason, Primary Intent, and Sentiment.
        Suggest the next best action.

        Transcript:
        ${transcript}

        Return JSON.
        `;

        const response = await client.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "object",
                    properties: {
                        outcome: { type: "string", enum: ["success", "noOutcome", "dropAtStep"] },
                        dropReason: { type: "string" },
                        primaryIntent: { type: "string" },
                        sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                        suggestedAction: { type: "string" },
                        confidence: { type: "number" },
                        keyPhrases: { type: "array", items: { type: "string" } }
                    },
                    required: ["outcome", "dropReason", "primaryIntent", "sentiment", "suggestedAction"]
                }
            }
        });

        return JSON.parse(response.text());

    } catch (error) {
        console.error("Chat Analysis Failed:", error);
        return null;
    }
};

exports.analyzeRealTimeRisk = async (recentMessages) => {
    try {
        if (!recentMessages) return null;

        const prompt = `
        Analyze the last few messages of an active chat.
        Identify current sentiment and risk of dropping off.
        
        Messages:
        ${recentMessages}
        
        Return JSON.
        `;

        const response = await client.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: {
                    type: "object",
                    properties: {
                        currentSentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                        riskScore: { type: "number", description: "0-100 score" },
                        riskReason: { type: "string" }
                    },
                    required: ["currentSentiment", "riskScore"]
                }
            }
        });

        return JSON.parse(response.text());

    } catch (error) {
        console.error("Real-time Risk Analysis Failed:", error);
        return null;
    }
};
