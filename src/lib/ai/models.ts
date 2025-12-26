// ============================================================================
// MODEL CONFIGURATION
// ============================================================================
// This file manages:
// 1. Available models shown in the UI dropdown
// 2. Server-side model allowlist (security)
// 3. Model ID normalization (different provider formats)
//
// KEY CONCEPTS:
// - Models must be added here to be available in the UI
// - The server validates all model IDs against this list (prevents abuse)
// - Model IDs use prefix convention: "provider/model-name"
//
// TO ADD A NEW MODEL:
// 1. Add it to MODEL_OPTIONS array below
// 2. Ensure the provider is configured in src/lib/ai/provider.ts
// 3. Restart the dev server
// 4. The model will appear in the UI dropdown automatically
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a selectable AI model in the UI.
 */
export type ModelOption = {
  /** Human-friendly label shown in the model selector dropdown */
  label: string;

  /**
   * Unique model identifier sent from client to server.
   *
   * Format convention: "provider/model-name"
   * Examples: "openai/gpt-5", "groq/llama-3.3-70b", "gateway/deepseek-r1"
   *
   * The server normalizes these IDs before passing to providers.
   */
  id: string;

  /** Provider name for logo display (openai, google, groq, etc.) */
  provider: "openai" | "google" | "groq" | "moonshot" | "qwen" | "meta";
};

// ============================================================================
// AVAILABLE MODELS
// ============================================================================
/**
 * List of models available in the application.
 *
 * SECURITY: This serves as both the UI model list AND the server-side allowlist.
 * Only models in this array can be used (prevents arbitrary model access).
 *
 * TO ADD A MODEL:
 * Simply add a new entry to this array:
 * { label: "Your Model Name", id: "provider/model-id" }
 *
 * NOTE: Make sure the provider is configured in src/lib/ai/provider.ts
 */
export const MODEL_OPTIONS: ModelOption[] = [
  // ──────────────────────────────────────────────────────────────────────
  // OPENAI MODELS
  // ──────────────────────────────────────────────────────────────────────
  { label: "GPT-5 (default)", id: "openai/gpt-5", provider: "openai" },
  { label: "GPT-4o", id: "openai/gpt-4o", provider: "openai" },
  { label: "o4-mini", id: "openai/o4-mini", provider: "openai" },

  // ──────────────────────────────────────────────────────────────────────
  // AI GATEWAY MODELS
  // ──────────────────────────────────────────────────────────────────────
  // Vercel AI Gateway provides unified access to multiple providers.
  // Requires AI_GATEWAY_API_KEY environment variable.
  { label: "GPT-5 (AI Gateway)", id: "gateway/openai/gpt-5", provider: "openai" },
  { label: "Gemini 2.5 Pro (AI Gateway)", id: "gateway/google/gemini-2.5-pro", provider: "google" },
  { label: "Nano Banana Pro (AI Gateway)", id: "gateway/google/gemini-3-pro-image", provider: "google" },

  // ──────────────────────────────────────────────────────────────────────
  // GROQ MODELS
  // ──────────────────────────────────────────────────────────────────────
  // Groq provides fast inference for open-source models.
  // Requires GROQ_API_KEY environment variable.
  { label: "Kimi K2 (Groq)", id: "groq/moonshotai/kimi-k2-instruct-0905", provider: "moonshot" },
  { label: "Qwen 3 32B (Groq)", id: "groq/qwen/qwen3-32b", provider: "qwen" },
  { label: "Llama 3.3 70B (Groq)", id: "groq/llama-3.3-70b-versatile", provider: "meta" },

  // ──────────────────────────────────────────────────────────────────────
  // ADD NEW MODELS HERE
  // ──────────────────────────────────────────────────────────────────────
  // Examples:
  // { label: "Claude 3.7 Sonnet", id: "anthropic/claude-3-7-sonnet" },
  // { label: "Llama 3.3 70B", id: "groq/llama-3.3-70b-versatile" },
  // { label: "Mixtral 8x7B", id: "groq/mixtral-8x7b-32768" },
  // ──────────────────────────────────────────────────────────────────────
];

// ============================================================================
// DEFAULT MODEL
// ============================================================================

/**
 * Get the default model ID.
 *
 * Uses AI_MODEL environment variable if set, otherwise falls back to "openai/gpt-5".
 * This allows deploying with a specific default model without code changes.
 *
 * @returns Default model ID (e.g., "openai/gpt-5")
 */
export function getDefaultModelId(): string {
  return process.env.AI_MODEL?.trim() || "openai/gpt-5";
}

// ============================================================================
// MODEL ID NORMALIZATION
// ============================================================================
// These functions strip the provider prefix from model IDs before passing
// to provider SDKs. Provider SDKs expect just the model name, not the prefix.
//
// Example: "openai/gpt-5" → "gpt-5"
// ============================================================================

/**
 * Normalize OpenAI model IDs by removing the "openai/" prefix.
 *
 * @param modelId - Full model ID (e.g., "openai/gpt-5" or "gpt-5")
 * @returns Normalized ID without prefix (e.g., "gpt-5")
 *
 * @example
 * normalizeOpenAIModelId("openai/gpt-5") // "gpt-5"
 * normalizeOpenAIModelId("gpt-5")        // "gpt-5"
 */
export function normalizeOpenAIModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (trimmed.startsWith("openai/")) {
    return trimmed.slice("openai/".length);
  }
  return trimmed;
}

/**
 * Normalize Groq model IDs by removing the "groq/" prefix.
 *
 * @param modelId - Full model ID (e.g., "groq/llama-3.3-70b")
 * @returns Normalized ID without prefix (e.g., "llama-3.3-70b")
 *
 * @example
 * normalizeGroqModelId("groq/deepseek-r1-distill-llama-70b")
 * // "deepseek-r1-distill-llama-70b"
 */
export function normalizeGroqModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (trimmed.startsWith("groq/")) {
    return trimmed.slice("groq/".length);
  }
  return trimmed;
}

/**
 * Normalize AI Gateway model IDs by removing the "gateway/" prefix.
 *
 * @param modelId - Full model ID (e.g., "gateway/deepseek-r1")
 * @returns Normalized ID without prefix (e.g., "deepseek-r1")
 *
 * @example
 * normalizeGatewayModelId("gateway/openai/gpt-5")
 * // "openai/gpt-5" (Gateway supports nested paths)
 */
export function normalizeGatewayModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (trimmed.startsWith("gateway/")) {
    return trimmed.slice("gateway/".length);
  }
  return trimmed;
}

// ──────────────────────────────────────────────────────────────────────
// ADD NEW NORMALIZATION FUNCTIONS HERE
// ──────────────────────────────────────────────────────────────────────
// If you add a new provider, add a normalize function following this pattern:
//
// export function normalizeYourProviderModelId(modelId: string): string {
//   const trimmed = modelId.trim();
//   if (trimmed.startsWith("yourprovider/")) {
//     return trimmed.slice("yourprovider/".length);
//   }
//   return trimmed;
// }
// ──────────────────────────────────────────────────────────────────────

// ============================================================================
// MODEL VALIDATION (SECURITY)
// ============================================================================
// These functions enforce that only allowed models can be used.
// This prevents users from accessing arbitrary models or providers.
// ============================================================================

/**
 * Check if a model ID is in the allowlist.
 *
 * SECURITY: This is checked server-side before creating model instances.
 * Only models in MODEL_OPTIONS (plus the env default) are allowed.
 *
 * @param modelId - Model ID to validate (e.g., "openai/gpt-5")
 * @returns True if the model is allowed, false otherwise
 */
export function isAllowedModelId(modelId: string): boolean {
  const allowed = new Set(MODEL_OPTIONS.map((m) => m.id));
  const normalized = modelId.trim();
  // Also allow env default even if UI list is edited (keeps deploys working).
  allowed.add(getDefaultModelId());
  return allowed.has(normalized);
}

/**
 * Assert that a model ID is allowed, throwing an error if not.
 *
 * SECURITY: Use this in API routes to validate client-provided model IDs.
 *
 * @param modelId - Model ID to validate
 * @throws Error if the model is not in the allowlist
 *
 * @example
 * // In API route:
 * assertAllowedModelId(modelId); // Throws if not allowed
 * const model = getModel(modelId); // Safe to use
 */
export function assertAllowedModelId(modelId: string): void {
  if (!isAllowedModelId(modelId)) {
    throw new Error(`Model not allowed: ${modelId}`);
  }
}


