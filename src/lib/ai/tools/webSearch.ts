import { tool } from "ai";
import { z } from "zod";

/**
 * Server-only web search tool.
 *
 * This starter template keeps search implementation intentionally minimal:
 * - In local dev (and in this repo), we return a deterministic mocked result set.
 * - When you are ready, replace the mock with a real search API call (Tavily, SerpAPI, Exa, etc).
 *
 * Why we still ship the tool now:
 * - It exercises multi-step tool calling.
 * - It powers citations in the UI (we treat tool results as "sources").
 */
export const webSearch = tool({
  description:
    "Search the web for up-to-date information. Use when the user asks for recent facts or citations.",
  inputSchema: z.object({
    query: z.string().min(1).describe("The search query."),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(5)
      .describe("Maximum number of results."),
  }),
  execute: async ({ query, maxResults }) => {
    // TODO: Replace this mock with a real API call.
    // Return shape is intentionally stable and UI-friendly.
    const results = [
      {
        title: "Mission burrito",
        url: "https://en.wikipedia.org/wiki/Mission_burrito",
        snippet:
          "Background and defining characteristics of the Mission-style burrito.",
      },
      {
        title: "San Francisco Mission District",
        url: "https://en.wikipedia.org/wiki/Mission_District,_San_Francisco",
        snippet: "Context about the neighborhood where the style originated.",
      },
      {
        title: "Burrito debate and local coverage",
        url: "https://www.eater.com/",
        snippet:
          "Food publications regularly cover the 'best burrito' and origin debates.",
      },
    ].slice(0, maxResults);

    return {
      query,
      results,
      note:
        "Mock results. Replace `webSearch` with a real search provider when you add integrations.",
    };
  },
});


