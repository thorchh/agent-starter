import { tool } from "ai";
import { z } from "zod/v3";

/**
 * Mock weather tool.
 *
 * This is deliberately deterministic so the starter works without external APIs.
 * Swap this implementation with a real weather provider later.
 */
export const getWeather = tool({
  description:
    "Get the current weather for a city (mocked/deterministic in this starter).",
  inputSchema: z.object({
    city: z.string().min(1).describe("City name, e.g. Copenhagen"),
    country: z
      .string()
      .optional()
      .describe("Optional country, e.g. Denmark or DK"),
  }),
  execute: async ({ city, country }) => {
    const seed = `${city.toLowerCase()}-${country?.toLowerCase() ?? ""}`;
    const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const conditions = ["sunny", "cloudy", "rain", "windy", "fog"] as const;
    const condition = conditions[hash % conditions.length];
    const tempC = (hash % 28) - 2; // -2..25

    return {
      location: { city, country: country ?? null },
      condition,
      temperatureC: tempC,
      source: "mock",
      note: "Replace this tool with a real API when you add integrations.",
    };
  },
});


