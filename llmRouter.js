require("dotenv").config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const USE_MOCK = process.env.USE_MOCK_LLM === "true";

async function mockRouter(userQuery) {
  const q = userQuery.toLowerCase();

  if (q.includes("weather")) {
    const match = q.match(/weather in ([a-z ,]+)/);
    const city = match ? match[1].trim() : "Unknown";
    return { tool: "weather", params: { city, units: "metric" } };
  }

  if (q.includes("employee") && q.includes("joined last month"))
    return {
      tool: "database",
      params: {
        entity: "employees",
        operation: "count",
        filter: "joined_last_month",
      },
    };

  if (q.includes("orders") || q.includes("order")) {
    const match = q.match(/(\d+)/);
    const threshold = match ? Number(match[1]) : 500;
    return {
      tool: "database",
      params: {
        entity: "orders",
        operation: "list",
        filter: "amount_over_threshold",
        threshold,
      },
    };
  }

  return { tool: "direct", params: { response: "I can answer directly." } };
}

async function llmRouter(userQuery) {
  if (USE_MOCK) return mockRouter(userQuery);

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    GEMINI_KEY;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are a routing assistant. Respond ONLY with JSON.

User query: ${userQuery}

Return JSON like:
{
  "tool": "weather" | "database" | "direct",
  "params": { ... }
}
`,
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "{}";

    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini error:", err);
    return mockRouter(userQuery);
  }
}

module.exports = llmRouter;
