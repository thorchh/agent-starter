"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageAttachment,
  MessageAttachments,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { cn } from "@/lib/utils";
import type { ChatStatus, UIMessage } from "ai";
import {
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
} from "ai";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Fragment, useMemo } from "react";

export type MessagePartsProps = ComponentProps<"div"> & {
  message: UIMessage;
  status: ChatStatus;
  isLastMessage: boolean;
  onRetry?: () => void;
};

/**
 * Render AI SDK `UIMessage.parts` using AI Elements.
 *
 * Why this exists:
 * - The AI SDK represents everything (text, files, tools, reasoning, sources) as parts.
 * - Centralizing part rendering keeps the rest of the UI extremely simple and makes
 *   future upgrades (DB persistence, generative UI, new part types) additive.
 *
 * Important: we render parts IN ORDER (like the AI Elements chatbot example),
 * so step boundaries, tool blocks, and reasoning show up where the SDK emitted them.
 */
export function MessageParts({
  className,
  message,
  status,
  isLastMessage,
  onRetry,
  ...props
}: MessagePartsProps) {
  const sources = message.parts.filter(
    (p) => p.type === "source-url" || p.type === "source-document"
  );

  const showActions = message.role === "assistant" && isLastMessage;

  // Compute a “copyable” assistant string from all text parts in this message.
  const copyText = useMemo(() => {
    if (message.role !== "assistant") return null;
    const joined = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("")
      .trim();
    return joined.length ? joined : null;
  }, [message.parts, message.role]);

  // Determine which text part (index) should show actions (retry/copy):
  // the last text part in the last assistant message.
  const lastTextPartIndex = useMemo(() => {
    if (!showActions) return -1;
    for (let i = message.parts.length - 1; i >= 0; i--) {
      if (message.parts[i]?.type === "text") return i;
    }
    return -1;
  }, [message.parts, showActions]);

  let displayedToolStepCounter = 0;

  return (
    <div className={cn("w-full", className)} {...props}>
      {message.role === "assistant" && sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          {sources.map((part, i) => (
            <SourcesContent key={`${message.id}-source-${i}`}>
              {"url" in part ? (
                <Source href={part.url} title={part.title ?? part.url} />
              ) : (
                // `source-document` does not have an href; we display the title.
                <Source
                  href="#"
                  title={part.title}
                  onClick={(e) => e.preventDefault()}
                />
              )}
            </SourcesContent>
          ))}
        </Sources>
      )}

      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text": {
            const isActionPart = showActions && i === lastTextPartIndex;

            return (
              <Message key={`${message.id}-text-${i}`} from={message.role}>
                <MessageContent>
                  <MessageResponse>{part.text}</MessageResponse>
                </MessageContent>

                {isActionPart && (
                  <MessageActions>
                    {onRetry && (
                      <MessageAction label="Retry" onClick={onRetry}>
                        <RefreshCcwIcon className="size-3" />
                      </MessageAction>
                    )}
                    <MessageAction
                      label="Copy"
                      onClick={() => {
                        if (copyText) {
                          navigator.clipboard.writeText(copyText);
                        }
                      }}
                    >
                      <CopyIcon className="size-3" />
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            );
          }

          case "file": {
            // Render file parts as attachments. This keeps them “in-stream” so they
            // appear exactly where the SDK emitted them.
            return (
              <Message key={`${message.id}-file-${i}`} from={message.role}>
                <MessageAttachments>
                  <MessageAttachment data={part} />
                </MessageAttachments>
              </Message>
            );
          }

          case "reasoning": {
            return (
              <Reasoning
                key={`${message.id}-reasoning-${i}`}
                className="w-full"
                isStreaming={
                  status === "streaming" &&
                  isLastMessage &&
                  i === message.parts.length - 1 &&
                  message.role === "assistant"
                }
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }

          case "step-start": {
            // AI SDK inserts `step-start` parts for multi-step runs. Showing every
            // step is often noisy. We only show a separator if the *step* contains
            // a tool invocation.
            const nextStepIdx = message.parts
              .slice(i + 1)
              .findIndex((p) => p.type === "step-start");
            const endExclusive =
              nextStepIdx === -1 ? message.parts.length : i + 1 + nextStepIdx;
            const stepSlice = message.parts.slice(i + 1, endExclusive);
            const stepHasTool = stepSlice.some((p) =>
              isToolOrDynamicToolUIPart(p as any)
            );

            if (!stepHasTool) {
              return null;
            }

            displayedToolStepCounter += 1;

            return (
              <div
                key={`${message.id}-step-${i}`}
                className="my-3 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-border" />
                <div className="text-muted-foreground text-xs">
                  Tool step {displayedToolStepCounter}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            );
          }

          default: {
            if (isToolOrDynamicToolUIPart(part as any)) {
              const toolName = getToolOrDynamicToolName(part as any);
              const title =
                "title" in (part as any) && (part as any).title
                  ? (part as any).title
                  : toolName;

              return (
                <Fragment key={`${message.id}-${(part as any).toolCallId}-${i}`}>
                  <Tool defaultOpen={false}>
                    <ToolHeader
                      state={(part as any).state}
                      title={title}
                      type={(part as any).type}
                    />
                    <ToolContent>
                      <ToolInput input={(part as any).input} />
                      <ToolOutput
                        errorText={(part as any).errorText}
                        output={(part as any).output}
                      />
                    </ToolContent>
                  </Tool>
                </Fragment>
              );
            }

            // source-* parts are rendered in the Sources header above
            // unknown part types are ignored for now.
            return null;
          }
        }
      })}
    </div>
  );
}


