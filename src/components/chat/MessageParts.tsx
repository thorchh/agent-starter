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
  type Part = UIMessage["parts"][number];

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

  // Pre-compute which `step-start` parts should be rendered (only when the step contains tools),
  // and assign stable “tool step” numbers without mutating during render.
  const toolStepLabelByPartIndex = useMemo(() => {
    let toolStep = 0;
    const labels = new Map<number, number>();

    for (let i = 0; i < message.parts.length; i++) {
      const part = message.parts[i];
      if (part?.type !== "step-start") continue;

      const nextStepIdx = message.parts
        .slice(i + 1)
        .findIndex((p) => p.type === "step-start");
      const endExclusive =
        nextStepIdx === -1 ? message.parts.length : i + 1 + nextStepIdx;
      const stepSlice = message.parts.slice(i + 1, endExclusive);
      const stepHasTool = stepSlice.some((p) => isToolOrDynamicToolUIPart(p));

      if (stepHasTool) {
        toolStep += 1;
        labels.set(i, toolStep);
      }
    }

    return labels;
  }, [message.parts]);

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

      {message.parts.map((part: Part, i) => {
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
            // Some providers/models emit a `reasoning` part without any readable text
            // (e.g. only timing metadata). In that case, showing the collapsible UI
            // is confusing—hide it unless there is content or it's actively streaming.
            const hasReasoningText = part.text.trim().length > 0;
            if (!hasReasoningText && part.state !== "streaming") {
              return null;
            }

            return (
              <Reasoning
                key={`${message.id}-reasoning-${i}`}
                className="w-full"
                isStreaming={
                  // Reasoning can stream as a dedicated part. Prefer the part's own state.
                  status === "streaming" &&
                  isLastMessage &&
                  message.role === "assistant" &&
                  part.state === "streaming"
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
            const label = toolStepLabelByPartIndex.get(i);
            if (!label) {
              return null;
            }

            return (
              <div
                key={`${message.id}-step-${i}`}
                className="my-3 flex items-center gap-3"
              >
                <div className="h-px flex-1 bg-border" />
                <div className="text-muted-foreground text-xs">
                  Tool step {label}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            );
          }

          default: {
            if (isToolOrDynamicToolUIPart(part)) {
              const toolName = getToolOrDynamicToolName(part);
              const title = "title" in part && part.title ? part.title : toolName;
              const headerType =
                part.type === "dynamic-tool"
                  ? (`tool-${toolName}` as const)
                  : part.type;

              return (
                <Fragment key={`${message.id}-${part.toolCallId}-${i}`}>
                  <Tool defaultOpen={false}>
                    <ToolHeader state={part.state} title={title} type={headerType} />
                    <ToolContent>
                      <ToolInput input={part.input} />
                      <ToolOutput
                        errorText={part.errorText}
                        output={part.output}
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


