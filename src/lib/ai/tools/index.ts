/**
 * Tool registry (server-side tools).
 *
 * Tools are exported as a simple object so:
 * - adding a new tool is as easy as creating a new file and exporting it here
 * - `streamText({ tools })` can infer tool types
 *
 * Later upgrade paths:
 * - tool “groups” and conditional tool activation
 * - MCP tool integration (dynamic tools)
 */

import { getTime } from "./getTime";
import { getWeather } from "./getWeather";
import { summarizeAttachments } from "./summarizeAttachments";

export const tools = {
  getTime,
  getWeather,
  summarizeAttachments,
};


