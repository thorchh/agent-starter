import { tool } from "ai";
import { z } from "zod/v3";

/**
 * `getTime` is intentionally boring: it’s a reliable “hello world” tool that
 * proves tool calling works end-to-end without any external dependencies.
 */
export const getTime = tool({
  description: "Get the current server time as an ISO string.",
  inputSchema: z.object({
    format: z
      .enum(["iso"])
      .optional()
      .describe("Optional output format. Currently only 'iso' is supported."),
  }),
  execute: async ({ format }) => {
    return {
      now: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      format: format ?? "iso",
    };
  },
});




