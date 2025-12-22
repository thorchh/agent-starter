// ============================================================================
// IMPORTS
// ============================================================================

import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { createGateway, extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { groq } from "@ai-sdk/groq";
import {
  normalizeGatewayModelId,
  normalizeGroqModelId,
  normalizeOpenAIModelId,
} from "./models";

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================
// This file centralizes all AI provider setup and routing logic.
//
// KEY CONCEPTS:
// - Each provider (OpenAI, Groq, Gateway) has its own setup function
// - The main getModel() function routes to the correct provider based on model ID
// - Middleware (like reasoning extraction) is applied here transparently
//
// TO ADD A NEW PROVIDER:
// 1. Install the provider SDK: pnpm install @ai-sdk/your-provider
// 2. Add environment variable to .env.local (e.g., YOUR_PROVIDER_API_KEY)
// 3. Create a getYourProviderModel() function below (see examples)
// 4. Add routing logic in getModel() function
// 5. Add models to src/lib/ai/models.ts
// ============================================================================

// ============================================================================
// OPENAI PROVIDER
// ============================================================================

/**
 * Get an OpenAI model instance.
 *
 * Supports all OpenAI models including GPT-4o, GPT-5, o-series (o1, o4-mini, etc.)
 *
 * Environment variable required: OPENAI_API_KEY
 *
 * @param modelId - Full model ID (e.g., "openai/gpt-4o") or just the model name
 * @returns Language model instance ready for use with streamText()
 */
export function getOpenAIModel(modelId: string): LanguageModel {
  // Normalize "openai/gpt-5" -> "gpt-5" for the OpenAI provider.
  const id = normalizeOpenAIModelId(modelId);

  // `@ai-sdk/openai` reads OPENAI_API_KEY from the environment by default.
  // Keeping provider creation centralized makes future changes low-impact.
  return openai(id);
}

// ============================================================================
// VERCEL AI GATEWAY PROVIDER
// ============================================================================

/**
 * AI Gateway provider instance.
 *
 * This uses @ai-sdk/gateway which targets the AI Gateway API and model catalog.
 * Requires an API key (and optionally other gateway-specific env).
 *
 * Environment variable required: AI_GATEWAY_API_KEY
 */
const gatewayProvider = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

/**
 * Get an AI Gateway model instance.
 *
 * The gateway provides unified access to multiple providers through a single endpoint.
 *
 * @param modelId - Full model ID (e.g., "gateway/gpt-4o")
 * @returns Language model instance
 */
export function getGatewayModel(modelId: string): LanguageModel {
  const id = normalizeGatewayModelId(modelId);
  return gatewayProvider(id);
}

// ============================================================================
// GROQ PROVIDER
// ============================================================================
// Groq provides fast inference for open-source models like Llama and Mixtral.
// No separate getGroqModel() function needed - handled inline in getModel().
//
// Environment variable required: GROQ_API_KEY
// ============================================================================

// ============================================================================
// MIDDLEWARE & MODEL ENHANCEMENT
// ============================================================================

/**
 * Apply reasoning extraction middleware for models that emit <think> tags.
 *
 * Some reasoning-focused models (notably DeepSeek R1) emit reasoning wrapped in
 * `<think>...</think>` tags as plain text. AI Elements expects reasoning as dedicated
 * `reasoning` parts, so we use the AI SDK's built-in middleware to extract the tag
 * content and stream it as reasoning.
 *
 * This middleware:
 * - Detects <think>...</think> tags in model output
 * - Extracts the content and streams it as a separate "reasoning" part
 * - Removes the tags from the main text response
 *
 * @param modelId - Full model ID to check if middleware should be applied
 * @param model - The base language model instance
 * @returns Enhanced model with reasoning extraction, or original model if not applicable
 *
 * @see https://ai-sdk.dev/cookbook/guides/r1
 */
function maybeWrapWithThinkTagReasoning(modelId: string, model: LanguageModel) {
  // Only provider model instances can be wrapped with middleware.
  // (String model IDs cannot.)
  if (typeof model === "string") return model;

  // Apply to DeepSeek R1 variants (Groq, AI Gateway, etc.).
  // This is intentionally a little broad; non-matching outputs simply won't extract anything.
  const shouldExtract =
    modelId.includes("deepseek-r1") || modelId.includes("deepseek-r1-distill");

  if (!shouldExtract) return model;

  return wrapLanguageModel({
    // `wrapLanguageModel` expects a LanguageModelV2. The runtime provider model instance
    // is compatible here, but the type isn't exported in our installed AI SDK version.
    model: model as never,
    middleware: extractReasoningMiddleware({
      tagName: "think",
      startWithReasoning: true,
    }),
  });
}

// ============================================================================
// MAIN PROVIDER ROUTING
// ============================================================================

/**
 * Get a language model instance based on model ID prefix.
 *
 * This is the main entry point for getting AI models. It routes to the correct
 * provider based on the model ID prefix convention:
 * - "gateway/..." → AI Gateway
 * - "groq/..." → Groq
 * - "openai/..." or no prefix → OpenAI (default)
 *
 * USAGE:
 * ```typescript
 * const model = getModel('openai/gpt-4o');
 * const result = await streamText({ model, ... });
 * ```
 *
 * TO ADD A NEW PROVIDER:
 * Add a new if statement here following the pattern:
 * ```typescript
 * if (trimmed.startsWith("yourprovider/")) {
 *   const id = normalizeYourProviderModelId(trimmed);
 *   return yourProviderClient(id);
 * }
 * ```
 *
 * @param modelId - Full model ID (e.g., "openai/gpt-4o", "groq/llama-3.3-70b")
 * @returns Language model instance ready for use
 */
export function getModel(modelId: string): LanguageModel {
  const trimmed = modelId.trim();

  // ──────────────────────────────────────────────────────────────────────
  // AI GATEWAY
  // ──────────────────────────────────────────────────────────────────────
  if (trimmed.startsWith("gateway/")) {
    return maybeWrapWithThinkTagReasoning(trimmed, getGatewayModel(trimmed));
  }

  // ──────────────────────────────────────────────────────────────────────
  // GROQ
  // ──────────────────────────────────────────────────────────────────────
  if (trimmed.startsWith("groq/")) {
    const id = normalizeGroqModelId(trimmed);
    // Groq provider reads GROQ_API_KEY from env.
    return maybeWrapWithThinkTagReasoning(trimmed, groq(id));
  }

  // ──────────────────────────────────────────────────────────────────────
  // ADD NEW PROVIDERS HERE
  // ──────────────────────────────────────────────────────────────────────
  // Example:
  // if (trimmed.startsWith("anthropic/")) {
  //   const id = normalizeAnthropicModelId(trimmed);
  //   return anthropic(id);
  // }
  // ──────────────────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────────────────
  // DEFAULT: OPENAI
  // ──────────────────────────────────────────────────────────────────────
  // If no prefix matches, assume OpenAI (supports "openai/gpt-4o" or "gpt-4o")
  return getOpenAIModel(trimmed);
}


