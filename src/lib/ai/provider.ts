import { openai } from "@ai-sdk/openai";
import type { LanguageModel, LanguageModelV2 } from "ai";

import { createGateway, extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { groq } from "@ai-sdk/groq";
import {
  normalizeGatewayModelId,
  normalizeGroqModelId,
  normalizeOpenAIModelId,
} from "./models";

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

/**
 * Vercel AI Gateway provider wiring.
 *
 * This uses @ai-sdk/gateway which targets the AI Gateway API and model catalog.
 * Requires an API key (and optionally other gateway-specific env).
 */
const gatewayProvider = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export function getGatewayModel(modelId: string): LanguageModel {
  const id = normalizeGatewayModelId(modelId);
  return gatewayProvider(id);
}

/**
 * Some reasoning-focused models (notably DeepSeek R1) often emit reasoning wrapped in
 * `<think>...</think>` tags as plain text. AI Elements expects reasoning as dedicated
 * `reasoning` parts, so we use the AI SDK's built-in middleware to extract the tag
 * content and stream it as reasoning.
 *
 * Ref: https://ai-sdk.dev/cookbook/guides/r1 (extractReasoningMiddleware)
 */
function maybeWrapWithThinkTagReasoning(modelId: string, model: LanguageModel) {
  // Only LanguageModelV2 instances can be wrapped with middleware.
  if (typeof model === "string") return model;

  // Apply to DeepSeek R1 variants (Groq, AI Gateway, etc.).
  // This is intentionally a little broad; non-matching outputs simply won't extract anything.
  const shouldExtract =
    modelId.includes("deepseek-r1") || modelId.includes("deepseek-r1-distill");

  if (!shouldExtract) return model;

  return wrapLanguageModel({
    // `wrapLanguageModel` expects a LanguageModelV2, which is what provider instances return.
    model: model as LanguageModelV2,
    middleware: extractReasoningMiddleware({
      tagName: "think",
      startWithReasoning: true,
    }),
  });
}

/**
 * Provider dispatch based on our model-id convention (`openai/...`, `groq/...`).
 *
 * Keeping this as a single function makes it trivial to add more providers later.
 */
export function getModel(modelId: string): LanguageModel {
  const trimmed = modelId.trim();

  if (trimmed.startsWith("gateway/")) {
    return maybeWrapWithThinkTagReasoning(trimmed, getGatewayModel(trimmed));
  }

  if (trimmed.startsWith("groq/")) {
    const id = normalizeGroqModelId(trimmed);
    // Groq provider reads GROQ_API_KEY from env.
    return maybeWrapWithThinkTagReasoning(trimmed, groq(id));
  }

  // Default to OpenAI.
  return getOpenAIModel(trimmed);
}


