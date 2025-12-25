const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
}

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.analyzeBotDrops = async (leadsData, workingHoursStrategy) => {
    try {
        if (!leadsData || leadsData.length === 0) return [];

        const prompt = `
        Analyze the following leads that did NOT receive a bot trigger.
        Determine operational reasons for the failure.

        Context:
        - Working Hours Strategy: ${JSON.stringify(workingHoursStrategy)}
        - Leads Data: ${JSON.stringify(leadsData)}

        Identify patterns such as:
        - Created outside working hours
        - Missing mandatory fields (Phone/Email)
        - Assignment delays (if timestamp provided)

        Return a list of root causes.
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
                            impact: { type: "string", enum: ["High", "Medium", "Low"] },
                            count: { type: "number" },
                            recommendation: { type: "string" }
                        },
                        required: ["reason", "impact", "count", "recommendation"]
                    }
                }
            }
        });

        return JSON.parse(response.text());

    } catch (error) {
        console.error("Operational Reasoning Failed:", error);
        return [];
    }
};
