// ============================================================================
// CHAT API ROUTE - POST /api/chat
// ============================================================================
// This is the main streaming chat endpoint.
//
// FLOW:
// 1. Client sends a new message via useChat hook
// 2. Server loads chat history from storage
// 3. Validates message and tools
// 4. Streams AI response back to client
// 5. Saves updated chat to storage when complete
//
// FEATURES:
// - Streaming responses (Server-Sent Events)
// - Multi-step tool calling
// - Web search (optional, via OpenAI built-in)
// - Reasoning summaries (o-series models)
// - Chat persistence (file-based dev, database in production)
//
// SECURITY:
// - Model allowlist validation (prevents arbitrary model access)
// - Tool validation (ensures type safety)
// ============================================================================

// ============================================================================
// IMPORTS
// ============================================================================

import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  validateUIMessages,
  type Tool,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";

import { assertAllowedModelId, getDefaultModelId } from "@/lib/ai/models";
import { getModel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";
import { loadChat, saveChat } from "@/lib/chat/server/fileChatStore";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum duration for streaming responses (Vercel serverless limit).
 * Increase this if you need longer-running requests.
 */
export const maxDuration = 30; // seconds

// ============================================================================
// TYPES
// ============================================================================

/**
 * Request body structure from client (useChat hook).
 */
type ChatRequestBody = {
  /** New message from user */
  message: UIMessage;

  /** Chat ID for loading/saving history */
  id: string;

  /** Optional model override (defaults to env AI_MODEL or "openai/gpt-5") */
  model?: string;

  /** Whether to enable web search (OpenAI built-in) */
  useSearch?: boolean;
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Handle streaming chat requests.
 *
 * This function orchestrates the entire chat flow:
 * - Validates inputs
 * - Loads chat history
 * - Configures AI model and tools
 * - Streams response to client
 * - Saves updated conversation
 */
export async function POST(req: Request) {
  try {
    // ──────────────────────────────────────────────────────────────────────
    // 1. PARSE AND VALIDATE REQUEST
    // ──────────────────────────────────────────────────────────────────────
    const body = (await req.json()) as ChatRequestBody;

    // Validate chat ID
    const id = body.id?.trim();
    if (!id) {
      return Response.json({ error: "Missing chat id" }, { status: 400 });
    }

    // Validate message
    const message = body.message;
    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. LOAD CHAT HISTORY
    // ──────────────────────────────────────────────────────────────────────
    // Client sends only the new message; server loads full history from storage.
    // This keeps client payloads small and ensures consistency.
    const previousMessages = await loadChat(id);
    const messages = [...previousMessages, message];

    // ──────────────────────────────────────────────────────────────────────
    // 3. CONFIGURE MODEL AND FEATURES
    // ──────────────────────────────────────────────────────────────────────
    const requestedModel = body.model?.trim() || getDefaultModelId();
    const useSearch = Boolean(body.useSearch);

    // SECURITY: Validate model against allowlist (prevents arbitrary model access)
    assertAllowedModelId(requestedModel);

    // ──────────────────────────────────────────────────────────────────────
    // 4. CONFIGURE REASONING (O-SERIES MODELS)
    // ──────────────────────────────────────────────────────────────────────
    // Reasoning features for o-series models (o1, o4-mini, etc.).
    // Environment variables:
    // - ENABLE_REASONING=true - Enable reasoning summaries
    // - OPENAI_REASONING_SUMMARY=auto|detailed - Detail level
    // - OPENAI_REASONING_EFFORT=high|medium|low - Effort level

    const enableReasoning =
      (process.env.ENABLE_REASONING ?? "").toLowerCase() === "true";

    // OpenAI reasoning configuration
    // When enabled, reasoning streams as part.type === "reasoning"
    // Ref: https://ai-sdk.dev/providers/ai-sdk-providers/openai
    const openaiReasoningSummary = (process.env.OPENAI_REASONING_SUMMARY?.trim() ||
      "auto") as "auto" | "detailed";
    const openaiReasoningEffort = (process.env.OPENAI_REASONING_EFFORT?.trim() ||
      "high") as "minimal" | "low" | "medium" | "high" | "none" | "xhigh";

    const shouldEnableOpenAIReasoningSummary =
      enableReasoning &&
      // OpenAI reasoning models: gpt-5 and o-series (o1, o4-mini, etc.)
      (requestedModel.startsWith("openai/gpt-5") ||
        requestedModel.startsWith("openai/o"));

    // ──────────────────────────────────────────────────────────────────────
    // 5. CONFIGURE WEB SEARCH (OPTIONAL)
    // ──────────────────────────────────────────────────────────────────────
    // OpenAI provides a built-in web_search tool for GPT models.
    // We only enable it when the user toggles search in the UI.

    const canUseOpenAIWebSearch =
      requestedModel.startsWith("openai/") ||
      requestedModel.startsWith("gateway/openai/");

    // ──────────────────────────────────────────────────────────────────────
    // 6. ASSEMBLE TOOLS
    // ──────────────────────────────────────────────────────────────────────
    // Combine our custom tools with optional provider tools (like web_search).
    // Type casting needed for AI SDK's tool validation.

    const requestTools: Record<string, Tool<unknown, unknown>> = {
      // Custom tools from src/lib/ai/tools/index.ts
      ...(tools as unknown as Record<string, Tool<unknown, unknown>>),

      // OpenAI web search (conditional)
      ...(useSearch && canUseOpenAIWebSearch
        ? ({
            web_search: openai.tools.webSearch() as unknown as Tool<
              unknown,
              unknown
            >,
          } as const)
        : {}),
    };

    // ──────────────────────────────────────────────────────────────────────
    // 7. VALIDATE MESSAGES
    // ──────────────────────────────────────────────────────────────────────
    // Validate that all tool calls in stored messages match current tool schemas.
    // This protects against schema changes breaking stored conversations.
    const validatedMessages = await validateUIMessages({
      messages,
      tools: requestTools,
    });

    type AnyPart = UIMessage["parts"][number];
    type FilePart = AnyPart & {
      type: "file";
      filename?: string;
      mediaType?: string;
      url?: string;
    };
    const isFilePart = (p: AnyPart): p is FilePart => p.type === "file";

    // Some models/providers can accept PDFs as file parts (cookbook pattern), but not all.
    // We keep the original UIMessage parts for rendering + persistence, and only strip file
    // parts from the *model prompt* when the current provider/model likely can't handle them.
    //
    // Ref: Chat with PDFs cookbook + file prompt cookbook
    // - https://ai-sdk.dev/cookbook/next/chat-with-pdf
    // - https://ai-sdk.dev/cookbook/next/generate-object-with-file-prompt
    //
    // Strategy:
    // - Always allow image/* and text/*.
    // - Allow application/pdf only for providers/models we expect to support it.
    // - For everything else, strip + add a note so the assistant asks for pasted text.
    const providerSupportsPdf =
      requestedModel.startsWith("openai/") ||
      requestedModel.startsWith("gateway/openai/") ||
      requestedModel.startsWith("gateway/google/") ||
      requestedModel.startsWith("gateway/anthropic/");

    const isSupportedFileForModel = (p: FilePart) => {
      const mt = p.mediaType ?? "";
      if (mt.startsWith("image/")) return true;
      if (mt.startsWith("text/")) return true;
      if (mt === "application/pdf") return providerSupportsPdf;
      return false;
    };

    const modelReadyMessages: UIMessage[] = validatedMessages.map((m) => {
      const parts = m.parts ?? [];
      const unsupportedFiles = parts
        .filter(isFilePart)
        .filter((p) => !isSupportedFileForModel(p));

      const supportedParts = parts.filter(
        (p) => !isFilePart(p) || isSupportedFileForModel(p)
      );

      if (m.role === "user" && unsupportedFiles.length > 0) {
        const summary = unsupportedFiles
          .map((f) => `${f.filename ?? "file"} (${f.mediaType ?? "unknown"})`)
          .join(", ");
        supportedParts.push({
          type: "text",
          text:
            `\n\n[Attachment received: ${summary}. ` +
            `This file type isn't automatically readable here. ` +
            `Please ask the user to paste the relevant text or convert it to a supported format.]\n`,
        });
      }

      return { ...m, parts: supportedParts };
    });

    // ──────────────────────────────────────────────────────────────────────
    // 8. BUILD SYSTEM PROMPT
    // ──────────────────────────────────────────────────────────────────────
    // Add search-specific instructions when search is enabled
    const system =
      SYSTEM_PROMPT +
      (useSearch && canUseOpenAIWebSearch
        ? "\n\nIMPORTANT - Search and Citations:\n" +
          "- Search is enabled. Use the `web_search` tool when helpful.\n" +
          "- When citing sources, use ONLY numbered markers [1], [2], [3] inline with your text.\n" +
          "- Do NOT add source names, domains, or URLs anywhere in your response text (e.g., do not write '(reuters.com)', '(source.com)', or similar).\n" +
          "- Do NOT create a 'Sources:' list or section at the end of your response.\n" +
          "- The numbered markers [1], [2] will automatically render as interactive citation badges with full source information.\n" +
          "- Write naturally and concisely - just add the [1], [2] markers where claims need citations."
        : "");

    // ──────────────────────────────────────────────────────────────────────
    // 9. STREAM AI RESPONSE
    // ──────────────────────────────────────────────────────────────────────
    const result = streamText({
      // Model instance from provider
      model: getModel(requestedModel),

      // System instructions
      system,

      // Convert UI messages to model format
      messages: await convertToModelMessages(modelReadyMessages),

      // Available tools
      tools: requestTools,

      // ──────────────────────────────────────────────────────────────────
      // PROVIDER-SPECIFIC OPTIONS
      // ──────────────────────────────────────────────────────────────────
      // OpenAI reasoning configuration (o-series models):
      // - reasoningEffort: Controls compute spend on reasoning
      // - reasoningSummary: Enables visible "thinking" in stream
      providerOptions: shouldEnableOpenAIReasoningSummary
        ? {
            openai: {
              reasoningSummary: openaiReasoningSummary,
              ...(requestedModel.startsWith("openai/o")
                ? { reasoningEffort: openaiReasoningEffort }
                : {}),
            },
          }
        : undefined,

      // ──────────────────────────────────────────────────────────────────
      // MULTI-STEP TOOL CALLING
      // ──────────────────────────────────────────────────────────────────
      // Cap tool calling at 5 steps to prevent infinite loops.
      // The AI can use tools iteratively but won't run forever.
      stopWhen: stepCountIs(5),
    });

    // ──────────────────────────────────────────────────────────────────────
    // 10. ENSURE STREAM COMPLETION (FOR PERSISTENCE)
    // ──────────────────────────────────────────────────────────────────────
    // Continue streaming even if client disconnects, so onFinish() saves the chat.
    // This prevents data loss when users navigate away mid-response.
    result.consumeStream(); // no await - runs in background

    // ──────────────────────────────────────────────────────────────────────
    // 11. RETURN STREAMING RESPONSE
    // ──────────────────────────────────────────────────────────────────────
    // Convert to UI message stream (includes reasoning + sources for AI Elements)
    return result.toUIMessageStreamResponse({
      // Enable reasoning parts (o-series models)
      sendReasoning: enableReasoning,

      // Enable source citations (web search)
      sendSources: true,

      // Original messages for diff detection
      originalMessages: validatedMessages,

      // Save chat when stream completes
      onFinish: async ({ messages }) => {
        await saveChat({ id, messages });
      },
    });
  } catch (err) {
    // ──────────────────────────────────────────────────────────────────────
    // ERROR HANDLING
    // ──────────────────────────────────────────────────────────────────────
    // Common errors:
    // - Missing API keys (check .env.local)
    // - Invalid model ID (check allowlist in src/lib/ai/models.ts)
    // - Network issues (check provider status)
    const message =
      err instanceof Error ? err.message : "Unknown error in /api/chat";
    return Response.json({ error: message }, { status: 500 });
  }
}


