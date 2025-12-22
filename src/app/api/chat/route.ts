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

// Allow streaming responses up to 30 seconds on Vercel.
export const maxDuration = 30;

type ChatRequestBody = {
  message: UIMessage;
  id: string;
  model?: string;
  useSearch?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const id = body.id?.trim();
    if (!id) {
      return Response.json({ error: "Missing chat id" }, { status: 400 });
    }
    const message = body.message;
    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    // Load previous messages from storage (docs pattern: client sends only last message).
    const previousMessages = await loadChat(id);
    const messages = [...previousMessages, message];
    const requestedModel = body.model?.trim() || getDefaultModelId();
    const useSearch = Boolean(body.useSearch);

    // Security: do not allow arbitrary model IDs from the client.
    assertAllowedModelId(requestedModel);

    // Feature flag: keep reasoning off by default (some orgs disallow it).
    // Set ENABLE_REASONING=true later to re-enable reasoning streaming + summaries.
    const enableReasoning =
      (process.env.ENABLE_REASONING ?? "").toLowerCase() === "true";

    // --- OpenAI "Reasoning Output" (reasoning summaries) ---
    // Per OpenAI provider docs, reasoning summaries are only emitted when
    // `providerOptions.openai.reasoningSummary` is set. When enabled, they stream as
    // `part.type === "reasoning"` (and show up in AI Elements via `sendReasoning: true`).
    // Ref: https://ai-sdk.dev/providers/ai-sdk-providers/openai
    const openaiReasoningSummary = (process.env.OPENAI_REASONING_SUMMARY?.trim() ||
      "auto") as "auto" | "detailed";
    const openaiReasoningEffort = (process.env.OPENAI_REASONING_EFFORT?.trim() ||
      "high") as "minimal" | "low" | "medium" | "high" | "none" | "xhigh";

    const shouldEnableOpenAIReasoningSummary =
      enableReasoning &&
      // OpenAI reasoning models (per docs/examples):
      (requestedModel.startsWith("openai/gpt-5") ||
        requestedModel.startsWith("openai/o"));

    // --- Search (opt-in from the UI) ---
    // The OpenAI provider defines a built-in `web_search` tool.
    // We only register it when the user enables Search to keep the default agent minimal.
    const canUseOpenAIWebSearch =
      requestedModel.startsWith("openai/") ||
      requestedModel.startsWith("gateway/openai/");

    // NOTE: `validateUIMessages` expects a `{ [name]: Tool<unknown, unknown> }` map.
    // Some provider-built tools (like `openai.tools.webSearch()`) are typed with `{}` inputs,
    // which can be too specific for the index signature. We normalize types here.
    const requestTools: Record<string, Tool<unknown, unknown>> = {
      ...(tools as unknown as Record<string, Tool<unknown, unknown>>),
      ...(useSearch && canUseOpenAIWebSearch
        ? ({
            web_search: openai.tools.webSearch() as unknown as Tool<
              unknown,
              unknown
            >,
          } as const)
        : {}),
    };

    // Validate UI messages against the current tool schemas before sending to the model.
    // This protects against stale/invalid stored tool calls and keeps the agent robust.
    const validatedMessages = await validateUIMessages({
      messages,
      tools: requestTools,
    });

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

    const result = streamText({
      model: getModel(requestedModel),
      system,
      messages: convertToModelMessages(validatedMessages),
      tools: requestTools,
      // Provider-specific options:
      // - OpenAI reasoning models (o-series) can be nudged to spend more compute on reasoning via `reasoningEffort`.
      //   This typically increases reasoning *tokens* but does not necessarily expose chain-of-thought text.
      // - To get *visible* "thinking output" in the stream, OpenAI requires `reasoningSummary`.
      //   When enabled, summaries show up as stream events of type `reasoning`.
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

      // Multi-step tools:
      // The AI SDK adds `step-start` parts when multiple steps are used.
      // We cap steps so the agent can use tools but won't loop forever.
      //
      // NOTE: We intentionally do NOT force exactly N steps; we just cap the run.
      // `stopWhen` is evaluated when tool results exist in the last step.
      stopWhen: stepCountIs(5),
    });

    // Optional but recommended for persistence: ensure the stream runs to completion
    // even if the client disconnects so `onFinish` can save the conversation.
    result.consumeStream(); // no await

    // Use UI message streaming so the client receives `message.parts`.
    // Opt-in to streaming "reasoning" + "sources" parts (as shown in AI Elements chatbot example).
    // Ref: https://ai-sdk.dev/elements/examples/chatbot
    return result.toUIMessageStreamResponse({
      sendReasoning: enableReasoning,
      sendSources: true,
      originalMessages: validatedMessages,
      onFinish: async ({ messages }) => {
        await saveChat({ id, messages });
      },
    });
  } catch (err) {
    // In local dev, the most common failure is missing provider credentials.
    // Returning JSON here ensures the client gets a readable error and `useChat` can trigger `onError`.
    const message =
      err instanceof Error ? err.message : "Unknown error in /api/chat";
    return Response.json({ error: message }, { status: 500 });
  }
}


