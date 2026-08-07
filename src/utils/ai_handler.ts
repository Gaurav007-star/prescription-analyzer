import Groq from "groq-sdk";

import { PRESCRIPTION_EXTRACT_PROMPT, PRESCRIPTION_INSIGHT_PROMPT } from "../prompts/prescription";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function callGroq(system: string, user: string) {

    const response = await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        temperature: 0.1,

        response_format: {
            type: "json_object",
        },

        messages: [
            {
                role: "system",
                content: system,
            },
            {
                role: "user",
                content: user,
            },
        ],
    });

    return JSON.parse(
        response.choices[0].message.content || "{}"
    );
}

export async function extractPrescription(text: string) {

    return callGroq(
        PRESCRIPTION_EXTRACT_PROMPT,
        text
    );
}

export async function generatePrescriptionInsights(extracted: object) {

    return callGroq(
        PRESCRIPTION_INSIGHT_PROMPT,
        JSON.stringify(extracted)
    );
}

export async function ai_handler(text: string, mode: string) {

    const extracted = await extractPrescription(text);

    const insights =
        await generatePrescriptionInsights(extracted);

    return {
        extracted,
        insights,
    };
}