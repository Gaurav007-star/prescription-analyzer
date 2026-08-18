import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

import {
  PRESCRIPTION_EXTRACT_PROMPT,
  PRESCRIPTION_INSIGHT_PROMPT,
  PRESCRIPTION_VERIFY_PROMPT,
} from "../prompts/prescription";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

// ─── Tool executor ────────────────────────────────────────────────────────────

const searchWeb = async ({ query }: { query: string }) => {
  console.log("Web search start:", query);

  const response = await tavilyClient.search(query, {
    max_results: 3,
    searchDepth: "basic",
    // includeDomains: ["1mg.com", "netmeds.com", "pharmeasy.in", "apollopharmacy.in", "medplusmart.com"],
  });

  return (
    response.results
      .map(
        (r) =>
          `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content?.slice(0, 300)}`,
      )
      .join("\n---\n") || "No results found."
  );
};

// ─── Simple Groq caller — JSON mode, no tools ─────────────────────────────────

async function callGroq(system: string, user: string) {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",

    temperature: 0.3,

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

  return JSON.parse(response.choices[0].message.content || "{}");
}

// ─── Agentic Groq caller — tool-calling while loop ────────────────────────────

async function callGroqForWebSearch(
  system: string,
  user: string,
  medicineCount = 5,
) {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  // Allow one search per medicine plus a small buffer
  const maxSearchCalls = medicineCount + 2;

  // NOTE: response_format json_object is incompatible with tools in Groq.
  // We parse JSON from the final text response manually.
  const searchTool: Groq.Chat.ChatCompletionTool = {
    type: "function",
    function: {
      name: "searchWeb",
      description:
        "Search the web for medicine information — price, manufacturer, and whether it exists. You MUST use this tool to search. Do NOT call any other tool.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query, e.g. 'Amoxicillin 500mg price manufacturer India'",
          },
        },
        required: ["query"],
      },
    },
  };

  let searchCallCount = 0;
  let retries = 0;
  let rateLimitRetries = 0;
  const maxRetries = 3;
  const maxRateLimitRetries = 5;

  while (true) {
    let response: Groq.Chat.ChatCompletion;
    try {
      response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0.3,
        messages,
        tools: [searchTool],
        tool_choice: { type: "function", function: { name: "searchWeb" } },
      });
      rateLimitRetries = 0; // reset on success
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const msg = err?.message || "";

      // Rate limit hit — wait and retry
      if (status === 429) {
        rateLimitRetries++;
        if (rateLimitRetries > maxRateLimitRetries) {
          console.error("[callGroqForWebSearch] Too many rate limit retries, aborting.");
          return {};
        }
        const retryAfter = Number(err?.headers?.get?.("retry-after")) || 10;
        console.warn(
          `[callGroqForWebSearch] Rate limited (attempt ${rateLimitRetries}/${maxRateLimitRetries}), waiting ${retryAfter}s…`,
        );
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }

      // Model hallucinated a tool name — Groq rejected it with 400
      if (
        status === 400 &&
        (msg.includes("tool call validation failed") ||
          msg.includes("not in request.tools"))
      ) {
        retries++;
        if (retries > maxRetries) {
          console.error(
            "[callGroqForWebSearch] Too many invalid tool call retries, aborting.",
          );
          return {};
        }
        console.warn(
          `[callGroqForWebSearch] Model called invalid tool (attempt ${retries}/${maxRetries}), retrying…`,
        );
        messages.push({
          role: "user",
          content:
            "Your last tool call was invalid. The ONLY tool available is 'searchWeb'. Do NOT call any other tool. Use 'searchWeb' to search, or return your final JSON answer as plain text.",
        });
        continue;
      }

      throw err;
    }

    const assistantMessage = response.choices[0].message;

    // Add assistant reply to message history
    messages.push(assistantMessage);

    // No tool calls → model is done, parse its final JSON response
    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      const content = assistantMessage.content || "{}";
      try {
        return JSON.parse(content);
      } catch {
        const jsonMatch =
          content.match(/```json\s*([\s\S]*?)```/) ||
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

      if (toolName === "searchWeb") {
        searchCallCount++;
        const result = await searchWeb(args as { query: string });
        // Small delay after each search to avoid hammering the token bucket
        await new Promise((r) => setTimeout(r, 1500));
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });

        if (searchCallCount >= maxSearchCalls) {
          messages.push({
            role: "user",
            content:
              "You have reached the search limit. Using the results you have so far, return the final JSON response immediately. Do not call searchWeb again.",
          });
        }
      } else {
        // Unknown tool — model is likely submitting its final answer via tool args
        console.error(
          `[callGroqForWebSearch] Model called unknown tool '${toolName}', treating args as final result.`,
        );
        return args;
      }
    }
  }
}

export async function extractPrescription(text: string) {
  return callGroq(PRESCRIPTION_EXTRACT_PROMPT, text);
}

export async function generatePrescriptionInsights(extracted: object) {
  return callGroq(PRESCRIPTION_INSIGHT_PROMPT, JSON.stringify(extracted));
}

export async function ai_handler(text: string, mode: string) {
  // Step 1: Extract structured data from OCR/LlamaIndex text
  const extracted = await extractPrescription(text);

  // Build medicine name list for verification
  const medicineNames =
    (extracted as any).medications
      ?.map((m: any, idx: number) => {
        if (m.name) {
          return [m.name, m.strength].filter(Boolean).join(" ");
        }
        const numMatch = m.raw_text?.match(/^\s*(\d+)\s*[.):\-]/);
        if (numMatch) {
          const suffix = m.strength ? ` ${m.strength}` : "";
          return `Medicine ${numMatch[1]}${suffix} (illegible)`;
        }
        return `Medicine ${idx + 1} (illegible)`;
      })
      .filter(Boolean) ?? [];

  // Step 2: Verify each medicine via web search tool calling
  let verified: any = { verified_medicines: [] };
  try {
    verified =
      medicineNames.length > 0
        ? await callGroqForWebSearch(
            PRESCRIPTION_VERIFY_PROMPT,
            JSON.stringify({ medicines: medicineNames }),
            medicineNames.length,
          )
        : { verified_medicines: [] };
  } catch (err) {
    console.error("[ai_handler] Medicine verification failed, continuing without it:", err);
  }

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
