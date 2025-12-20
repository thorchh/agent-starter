/**
 * Model selection, allowlisting, and normalization.
 *
 * Why this file exists:
 * - The UI needs a list of selectable models.
 * - The server must validate the selected model to prevent arbitrary provider/model usage.
 * - We keep a small normalization layer so we can migrate between:
 *   - provider-specific IDs (e.g. "gpt-5")
 *   - gateway-style IDs (e.g. "openai/gpt-5")
 *   without rewriting the UI.
 */

export type ModelOption = {
  /** Human-friendly label for dropdowns. */
  label: string;
  /**
   * Stable identifier sent from client -> server.
   *
   * In this template we accept both:
   * - "gpt-5"
   * - "openai/gpt-5"
   *
   * Server normalizes before constructing provider models.
   */
  id: string;
};

/**
 * Keep this list small and intentional for the starter template.
 * Add models here and they automatically become available in the UI and server allowlist.
 */
export const MODEL_OPTIONS: ModelOption[] = [
  { label: "GPT-5 (default)", id: "openai/gpt-5" },
  { label: "GPT-4o", id: "openai/gpt-4o" },
  { label: "o4-mini", id: "openai/o4-mini" },
  // Vercel AI Gateway (server-side only): useful when you want a single API key and a unified model catalog.
  // NOTE: Requires AI Gateway credentials. See README for env vars.
  { label: "GPT-5 (AI Gateway)", id: "gateway/openai/gpt-5" },
  { label: "DeepSeek R1 (AI Gateway)", id: "gateway/deepseek-r1" },
  // Gemini via AI Gateway (model id can include provider prefixes; we pass through after `gateway/`).
  // If your gateway catalog uses a different ID, change this string to match it.
  { label: "Gemini 2.5 Pro (AI Gateway)", id: "gateway/google/gemini-2.5-pro" },
  // Groq-hosted DeepSeek R1 (distilled) model.
  // Groq model request name (per Groq docs) is: deepseek-r1-distill-llama-70b
  { label: "DeepSeek R1 (Groq)", id: "groq/deepseek-r1-distill-llama-70b" },
];

export function getDefaultModelId(): string {
  return process.env.AI_MODEL?.trim() || "openai/gpt-5";
}

/**
 * Normalize model IDs into the provider-specific form used by @ai-sdk/openai.
 *
 * Example:
 * - "openai/gpt-5" -> "gpt-5"
 * - "gpt-5" -> "gpt-5"
 */
export function normalizeOpenAIModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (trimmed.startsWith("openai/")) {
    return trimmed.slice("openai/".length);
  }
  return trimmed;
}

/**
 * Normalize model IDs into the provider-specific form used by @ai-sdk/groq.
 *
 * Example:
 * - "groq/deepseek-r1-distill-llama-70b" -> "deepseek-r1-distill-llama-70b"
 */
export function normalizeGroqModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (trimmed.startsWith("groq/")) {
    return trimmed.slice("groq/".length);
  }
  return trimmed;
}

/**
 * Normalize model IDs into the provider-specific form used by @ai-sdk/gateway.
 *
 * Example:
 * - "gateway/deepseek-r1" -> "deepseek-r1"
 */
export function normalizeGatewayModelId(modelId: string): string {
  const trimmed = modelId.trim();
  if (trimmed.startsWith("gateway/")) {
    return trimmed.slice("gateway/".length);
  }
  return trimmed;
}

export function isAllowedModelId(modelId: string): boolean {
  const allowed = new Set(MODEL_OPTIONS.map((m) => m.id));
  const normalized = modelId.trim();
  // Also allow env default even if UI list is edited (keeps deploys working).
  allowed.add(getDefaultModelId());
  return allowed.has(normalized);
}

export function assertAllowedModelId(modelId: string): void {
  if (!isAllowedModelId(modelId)) {
    throw new Error(`Model not allowed: ${modelId}`);
  }
}


