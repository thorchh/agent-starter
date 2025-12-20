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


