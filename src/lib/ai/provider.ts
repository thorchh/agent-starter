import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { normalizeOpenAIModelId } from "./models";

/**
 * OpenAI provider wiring.
 *
 * We keep this in one place so it’s easy to:
 * - swap providers
 * - route via AI Gateway later
 * - add middleware (logging/telemetry/guardrails) without touching route handlers
 */

export function getOpenAIModel(modelId: string): LanguageModel {
  // Normalize "openai/gpt-5" -> "gpt-5" for the OpenAI provider.
  const id = normalizeOpenAIModelId(modelId);

  // `@ai-sdk/openai` reads OPENAI_API_KEY from the environment by default.
  // Keeping provider creation centralized makes future changes low-impact.
  return openai(id);
}


