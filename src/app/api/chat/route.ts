import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";

import { assertAllowedModelId, getDefaultModelId } from "@/lib/ai/models";
import { getModel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";

// Allow streaming responses up to 30 seconds on Vercel.
export const maxDuration = 30;

type ChatRequestBody = {
  messages: UIMessage[];
  model?: string;
  useSearch?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = body.messages ?? [];
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

    const requestTools = {
      ...tools,
      ...(useSearch && canUseOpenAIWebSearch
        ? { web_search: openai.tools.webSearch() }
        : {}),
    };

    const system =
      SYSTEM_PROMPT +
      (useSearch && canUseOpenAIWebSearch
        ? "\n\nSearch is enabled. You may use the `web_search` tool when helpful. When you cite sources, add inline markers like [1], [2] that correspond to the source list."
        : "");

    const result = streamText({
      model: getModel(requestedModel),
      system,
      messages: convertToModelMessages(messages),
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

    // Use UI message streaming so the client receives `message.parts`.
    // Opt-in to streaming "reasoning" + "sources" parts (as shown in AI Elements chatbot example).
    // Ref: https://ai-sdk.dev/elements/examples/chatbot
    return result.toUIMessageStreamResponse({
      sendReasoning: enableReasoning,
      sendSources: true,
    });
  } catch (err) {
    // In local dev, the most common failure is missing provider credentials.
    // Returning JSON here ensures the client gets a readable error and `useChat` can trigger `onError`.
    const message =
      err instanceof Error ? err.message : "Unknown error in /api/chat";
    return Response.json({ error: message }, { status: 500 });
  }
}


