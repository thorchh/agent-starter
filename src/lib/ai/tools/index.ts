// ============================================================================
// TOOL REGISTRY
// ============================================================================
// This file is the central registry for all AI tools (functions the AI can call).
//
// HOW IT WORKS:
// 1. Tools are defined in individual files (getTime.ts, getWeather.ts, etc.)
// 2. Import them here and add to the `tools` object
// 3. The AI automatically knows about all exported tools
// 4. Tools execute server-side when the AI calls them
//
// TO ADD A NEW TOOL:
// 1. Create a new file: src/lib/ai/tools/yourTool.ts
// 2. Define the tool using tool() function (see examples/)
// 3. Import it here: import { yourTool } from "./yourTool";
// 4. Add to tools object: yourTool,
// 5. Restart dev server
//
// TOOL EXAMPLES:
// See src/lib/ai/tools/examples/ for templates:
// - mockDatabase.ts - Database queries (Postgres, Prisma, MongoDB)
// - sendEmail.ts - External API calls (Resend, SendGrid, Mailgun)
// - searchCustomAPI.ts - Custom search (Tavily, SerpAPI, Exa, Brave)
//
// WEB SEARCH:
// This starter uses OpenAI's built-in web_search tool (enabled via UI toggle).
// For custom search providers, see examples/searchCustomAPI.ts
//
// FUTURE ENHANCEMENTS:
// - Conditional tools based on user permissions or context
// - Tool groups (e.g., "admin tools", "data tools")
// - MCP (Model Context Protocol) tool integration for dynamic tools
// ============================================================================

// ============================================================================
// IMPORTS
// ============================================================================

import { getTime } from "./getTime";
import { getWeather } from "./getWeather";
import { summarizeAttachments } from "./summarizeAttachments";

// ──────────────────────────────────────────────────────────────────────
// IMPORT NEW TOOLS HERE
// ──────────────────────────────────────────────────────────────────────
// Example:
// import { getUserFromDatabase } from "./getUserFromDatabase";
// import { sendEmail } from "./sendEmail";
// import { searchWeb } from "./searchWeb";
// ──────────────────────────────────────────────────────────────────────

// ============================================================================
// TOOL EXPORTS
// ============================================================================
/**
 * Main tools object exported to AI API routes.
 *
 * All tools added here become available to the AI automatically.
 * The AI SDK infers types from this object, providing full type safety.
 *
 * USAGE IN API ROUTE:
 * ```typescript
 * import { tools } from '@/lib/ai/tools';
 * const result = await streamText({ model, messages, tools });
 * ```
 */
export const tools = {
  // ──────────────────────────────────────────────────────────────────────
  // TIME & DATE TOOLS
  // ──────────────────────────────────────────────────────────────────────
  getTime, // Get current server time

  // ──────────────────────────────────────────────────────────────────────
  // UTILITY TOOLS
  // ──────────────────────────────────────────────────────────────────────
  getWeather, // Get weather for a city
  summarizeAttachments, // Summarize uploaded attachments

  // ──────────────────────────────────────────────────────────────────────
  // ADD NEW TOOLS HERE
  // ──────────────────────────────────────────────────────────────────────
  // Follow this pattern:
  // categoryName, // Brief description
  //
  // Examples:
  // getUserFromDatabase, // Query user database
  // sendEmail, // Send email via Resend
  // searchWeb, // Search the web with Tavily
  // ──────────────────────────────────────────────────────────────────────
};


