import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { assertAllowedModelId, getDefaultModelId } from "@/lib/ai/models";
import { getOpenAIModel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { tools } from "@/lib/ai/tools";

// Allow streaming responses up to 30 seconds on Vercel.
export const maxDuration = 30;

type ChatRequestBody = {
  messages: UIMessage[];
  model?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const messages = body.messages ?? [];
    const requestedModel = body.model?.trim() || getDefaultModelId();

    // Security: do not allow arbitrary model IDs from the client.
    assertAllowedModelId(requestedModel);

    const result = streamText({
      model: getOpenAIModel(requestedModel),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools,

      // Multi-step tools:
      // The AI SDK adds `step-start` parts when multiple steps are used.
      // We cap steps so the agent can use tools but won't loop forever.
      //
      // NOTE: We intentionally do NOT force exactly N steps; we just cap the run.
      // `stopWhen` is evaluated when tool results exist in the last step.
      stopWhen: stepCountIs(5),
    });

    // Use UI message streaming so the client receives `message.parts` for tools/files/reasoning/etc.
    return result.toUIMessageStreamResponse();
  } catch (err) {
    // In local dev, the most common failure is missing provider credentials.
    // Returning JSON here ensures the client gets a readable error and `useChat` can trigger `onError`.
    const message =
      err instanceof Error ? err.message : "Unknown error in /api/chat";
    return Response.json({ error: message }, { status: 500 });
  }
}


