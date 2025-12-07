// llmRouter.js
require("dotenv").config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const USE_MOCK = process.env.USE_MOCK_LLM === "true";

// ------------------ MOCK ROUTER (fallback) ------------------
function mockRouter(userQuery) {
  const q = userQuery.toLowerCase();

  if (q.includes("weather")) {
    const match = q.match(/weather in ([a-z ,]+)/i);
    const city = match ? match[1].trim() : "Unknown";
    return { tool: "weather", params: { city, units: "metric" } };
  }

  // Simple mock DB routing
  if (q.includes("employee") && q.includes("joined last month")) {
    return {
      tool: "database",
      params: {
        entity: "employees",
        operation: "count",
        filter: { joined_at: { "$gte": "2025-11-01", "$lte": "2025-11-30" } },
        summaryHint: "employees who joined last month"
      }
    };
  }

  if (q.includes("order")) {
    const match = q.match(/(\d+)/);
    const threshold = match ? Number(match[1]) : 500;
    return {
      tool: "database",
      params: {
        entity: "orders",
        operation: "list",
        filter: { amount: { "$gt": threshold } },
        fields: ["customer_name", "amount"],
        sort: { amount: -1 },
        limit: 10,
        summaryHint: `orders over $${threshold}`
      }
    };
  }

  return { tool: "direct", params: { response: "Let me answer that directly." } };
}

// ------------------ Helper: parse Gemini JSON safely ------------------
function parseGeminiJson(raw) {
  if (!raw) throw new Error("Empty LLM response");

  // Strip ```json and ``` fences if present
  let text = raw
    .replace(/```json/i, "")
    .replace(/```/g, "")
    .trim();

  // Try direct JSON parse
  try {
    return JSON.parse(text);
  } catch (_) {
    // Try to grab just the { ... } part
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const jsonPart = text.slice(start, end + 1);
      return JSON.parse(jsonPart);
    }
    throw new Error("Could not parse JSON from Gemini output");
  }
}

// ------------------ REAL LLM ROUTER ------------------
async function llmRouter(userQuery) {
  if (USE_MOCK) return mockRouter(userQuery);

  if (!GEMINI_KEY) {
    console.error("GEMINI_API_KEY is not set, using mock router.");
    return mockRouter(userQuery);
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GEMINI_KEY;

  const systemPrompt = `
You are a routing assistant for a backend server.

You MUST respond with ONLY a JSON object, no markdown, no comments, no extra text.

Top-level JSON format:
{
  "tool": "weather" | "database" | "direct",
  "params": { ... }
}

1) WEATHER QUERIES
If the user asks about weather:
- tool: "weather"
- params:
  {
    "city": "<city name>",
    "units": "metric"   // default
  }

2) DATABASE QUERIES
If the user asks about employees, orders, or any database-like data:
- tool: "database"
- params:
  {
    "entity": "<collection name, e.g. 'employees', 'orders'>",
    "operation": "count" | "list",
    "filter": { ... },              // Mongo-style filter
    "fields": [ "...optional..." ], // which fields to return for "list"
    "sort": { "...optional..." },   // sort order for "list"
    "limit": 10,                    // optional limit
    "summaryHint": "<short human description of the condition>"
  }

Examples:

User: "How many employees joined last month?"
→
{
  "tool": "database",
  "params": {
    "entity": "employees",
    "operation": "count",
    "filter": {
      "joined_at": {
        "$gte": "2025-11-01",
        "$lte": "2025-11-30"
      }
    },
    "summaryHint": "employees who joined last month"
  }
}

User: "List all orders over $500."
→
{
  "tool": "database",
  "params": {
    "entity": "orders",
    "operation": "list",
    "filter": {
      "amount": { "$gt": 500 }
    },
    "fields": ["customer_name", "amount"],
    "sort": { "amount": -1 },
    "limit": 10,
    "summaryHint": "orders over $500"
  }
}

3) DIRECT ANSWERS
If no tools are required:
- tool: "direct"
- params: { "response": "<short answer in English>" }
`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt + "\n\nUser query: " + userQuery + "\n\nRespond ONLY with JSON."
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Gemini HTTP error:", res.status, res.statusText, body);
      return mockRouter(userQuery);
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "";

    console.log("Gemini raw routing output:", text);

    const routing = parseGeminiJson(text);
    return routing;
  } catch (err) {
    console.error("Gemini error, using mock router:", err.message);
    return mockRouter(userQuery);
  }
}

module.exports = llmRouter;
