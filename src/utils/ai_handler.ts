import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

import { PRESCRIPTION_EXTRACT_PROMPT, PRESCRIPTION_INSIGHT_PROMPT, PRESCRIPTION_VERIFY_PROMPT } from "../prompts/prescription";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
})

// ─── Tool executor ────────────────────────────────────────────────────────────

const searchWeb = async ({ query }: { query: string }) => {
    console.log("Web search start:", query);

    const response = await tavilyClient.search(query, {
        max_results: 3,
        searchDepth: "basic",
        // includeDomains: ["1mg.com", "netmeds.com", "pharmeasy.in", "apollopharmacy.in", "medplusmart.com"],
    });

    return response.results
        .map(r => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content?.slice(0, 300)}`)
        .join("\n---\n") || "No results found.";
}

// ─── Simple Groq caller — JSON mode, no tools ─────────────────────────────────

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

// ─── Agentic Groq caller — tool-calling while loop ────────────────────────────

async function callGroqForWebSearch(system: string, user: string, medicineCount = 5) {

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: system },
        { role: "user", content: user },
    ];

    // Allow one search per medicine plus a small buffer
    const maxSearchCalls = medicineCount + 2;

    // NOTE: response_format json_object is incompatible with tools in Groq.
    // We parse JSON from the final text response manually.
    let searchCallCount = 0;
    while (true) {
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            temperature: 0.3,
            messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "searchWeb",
                        description: "Search the web for medicine information — price, manufacturer, and whether it exists.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The search query, e.g. 'Amoxicillin 500mg price manufacturer India'"
                                },
                            },
                            required: ["query"]
                        }
                    }
                }
            ],
            tool_choice: "auto"
        });

        const assistantMessage = response.choices[0].message;

        // Add assistant reply to message history
        messages.push(assistantMessage);

        // No tool calls → model is done, parse its final JSON response
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
            const content = assistantMessage.content || "{}";
            try {
                return JSON.parse(content);
            } catch {
                // Model may have wrapped JSON in a markdown code block
                const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ||
                    content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
                }
                console.error("[callGroqForWebSearch] Could not parse JSON:", content);
                return {};
            }
        }

        // Execute each tool call and feed results back into messages
        for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || "{}");

            // If model calls searchWeb → execute it and feed result back
            if (toolName === "searchWeb") {
                searchCallCount++;
                const result = await searchWeb(args as { query: string });
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: result,
                });

                // Hard cap reached — tell the model to stop searching and return JSON
                if (searchCallCount >= maxSearchCalls) {
                    messages.push({
                        role: "user",
                        content: "You have reached the search limit. Using the results you have so far, return the final JSON response immediately. Do not call searchWeb again."
                    });
                }
            } else {
                // Model tried to call an unknown tool (e.g. verify_medicine_results)
                // This means it finished all searches and is submitting its final answer
                // via the tool arguments — parse them as the final result
                console.error(`[callGroqForWebSearch] Model submitted final result via unknown tool: ${toolName}`);
                return args;
            }
        }
    }

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

    // Step 1: Extract structured data from OCR/LlamaIndex text
    const extracted = await extractPrescription(text);

    // Step 2: Verify each medicine via web search tool calling
    // Only pass medicine names — not the full prescription JSON — to keep token count low
    const medicineNames = (extracted as any).medications
        ?.map((m: any, idx: number) => {
            if (m.name) {
                // Normal case — use extracted name + strength
                return [m.name, m.strength].filter(Boolean).join(" ");
            }

            // Name is null (illegible handwriting etc.) — generate a readable fallback
            // Try to extract a number prefix from raw_text, e.g. "4. [illegible] BD x 5 days" → "Medicine 4"
            const numMatch = m.raw_text?.match(/^\s*(\d+)\s*[.):\-]/);
            if (numMatch) {
                const suffix = m.strength ? ` ${m.strength}` : "";
                return `Medicine ${numMatch[1]}${suffix} (illegible)`;
            }

            // No number found — fall back to position in list (1-based)
            return `Medicine ${idx + 1} (illegible)`;
        })
        .filter(Boolean) ?? [];

    const verified = medicineNames.length > 0
        ? await callGroqForWebSearch(
            PRESCRIPTION_VERIFY_PROMPT,
            JSON.stringify({ medicines: medicineNames }),
            medicineNames.length
        )
        : { verified_medicines: [] };

    // Step 3: Generate insights using verified medicine data
    const enrichedData = {
        ...extracted,
        medicine_verification: verified.verified_medicines ?? [],
    };

    const insights = await generatePrescriptionInsights(enrichedData);

    return {
        extracted,
        medicine_verification: verified.verified_medicines ?? [],
        insights,
    };
}
