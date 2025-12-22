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
import { MarkdownWithCitations } from "@/components/chat/MarkdownWithCitations";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
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
import {
  CloudSunIcon,
  ClockIcon,
  CopyIcon,
  FileTextIcon,
  RefreshCcwIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Fragment, useMemo, useState } from "react";

export type MessagePartsProps = ComponentProps<"div"> & {
  message: UIMessage;
  status: ChatStatus;
  isLastMessage: boolean;
  onRetry?: () => void;
  /**
   * When true, render tool invocations in a verbose, debug-friendly format:
   * - tool step separators
   * - full input/output JSON blocks
   *
   * When false (default), render a cleaner, user-facing presentation.
   */
  debug?: boolean;
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
  debug = false,
  ...props
}: MessagePartsProps) {
  type Part = UIMessage["parts"][number];

  const sources = message.parts.filter(
    (p) => p.type === "source-url" || p.type === "source-document"
  );

  const citationSources = useMemo(() => {
    // De-dupe by URL while preserving first-seen order (providers can repeat sources).
    const seen = new Set<string>();
    const out: Array<{ url: string; title: string }> = [];

    for (const part of sources) {
      if (!("url" in part)) continue; // `source-document` has no URL; skip for inline citations.
      if (seen.has(part.url)) continue;
      seen.add(part.url);
      out.push({ url: part.url, title: part.title ?? part.url });
    }

    return out;
  }, [sources]);

  const showActions = message.role === "assistant" && isLastMessage;

  const toolParts = useMemo(
    () => message.parts.filter((p) => isToolOrDynamicToolUIPart(p)),
    [message.parts]
  );

  const firstToolPartIndex = useMemo(() => {
    if (toolParts.length === 0) return -1;
    return message.parts.findIndex((p) => isToolOrDynamicToolUIPart(p));
  }, [message.parts, toolParts.length]);

  const lastToolPartIndex = useMemo(() => {
    for (let i = message.parts.length - 1; i >= 0; i--) {
      if (isToolOrDynamicToolUIPart(message.parts[i])) return i;
    }
    return -1;
  }, [message.parts]);

  const hasStreamingFinalTextAfterTools = useMemo(() => {
    // If the assistant is streaming text after tools completed, we treat that as
    // "final answer streaming" and auto-collapse the thought thread.
    if (lastToolPartIndex === -1) return false;
    for (let i = lastToolPartIndex + 1; i < message.parts.length; i++) {
      const p = message.parts[i];
      if (p?.type === "text" && p.state === "streaming") return true;
    }
    return false;
  }, [lastToolPartIndex, message.parts]);

  // --- Thought thread (ChainOfThought) open/close behavior ---
  // We avoid effects here (linted in this repo) and instead derive open state:
  // - Auto-open while tools are running.
  // - Auto-collapse when final text starts streaming.
  // - Allow user override by clicking the trigger.
  const [thoughtOpenOverride, setThoughtOpenOverride] = useState<boolean | null>(
    null
  );

  const shouldShowThoughtThread =
    !debug && message.role === "assistant" && isLastMessage && toolParts.length > 0;

  const autoThoughtOpen =
    shouldShowThoughtThread &&
    (status === "submitted" || status === "streaming") &&
    !hasStreamingFinalTextAfterTools;

  const thoughtOpen = shouldShowThoughtThread
    ? (thoughtOpenOverride ?? autoThoughtOpen)
    : false;

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

  const uniqueSourcesForHeader = useMemo(() => {
    // Keep the Sources UI clean by de-duping URL sources and documents.
    const seen = new Set<string>();
    const out: typeof sources = [];
    for (const part of sources) {
      if ("url" in part) {
        if (seen.has(part.url)) continue;
        seen.add(part.url);
      } else {
        const key = `${part.mediaType}:${part.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push(part);
    }
    return out;
  }, [sources]);

  return (
    <div className={cn("w-full", className)} {...props}>
      {message.role === "assistant" && uniqueSourcesForHeader.length > 0 && (
        <Sources>
          <SourcesTrigger count={uniqueSourcesForHeader.length} />
          {uniqueSourcesForHeader.map((part, i) => (
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
                  {message.role === "assistant" && citationSources.length > 0 ? (
                    <MarkdownWithCitations
                      markdown={part.text}
                      sources={citationSources}
                    />
                  ) : (
                    // Default markdown renderer (AI Elements Streamdown wrapper).
                    <MessageResponse>{part.text}</MessageResponse>
                  )}
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
            const isOmitted =
              typeof part.url === "string" &&
              (part.url.startsWith("local-storage://omitted") ||
                part.url.startsWith("omitted://"));

            return (
              <Message key={`${message.id}-file-${i}`} from={message.role}>
                <MessageAttachments>
                  {isOmitted ? (
                    <div className="rounded-xl border bg-muted/30 px-3 py-2">
                      <div className="text-sm font-medium">
                        {part.filename || "Attachment"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {part.mediaType}
                      </div>
                      <div className="text-muted-foreground mt-1 text-[11px]">
                        Attachment content isn’t persisted in localStorage. Re-upload
                        if you need to reference it after refresh.
                      </div>
                    </div>
                  ) : (
                    <MessageAttachment data={part} />
                  )}
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
            // AI SDK inserts `step-start` parts for multi-step runs.
            // For user-facing UI we hide these entirely (they're mostly a debugging artifact).
            if (!debug) {
              return null;
            }

            // In debug mode we show a separator only if the step contains a tool invocation.
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
              // User-facing: hide raw tool blocks; show a clean ChainOfThought summary once.
              if (!debug) {
                if (i !== firstToolPartIndex) return null;

                // Render a single collapsible "thread" that lists each tool invocation as its own step
                // (we intentionally do NOT group or collapse multiple searches).
                return (
                  <ChainOfThought
                    key={`${message.id}-tool-summary`}
                    className="w-full pb-2"
                    onOpenChange={setThoughtOpenOverride}
                    open={thoughtOpen}
                  >
                    <ChainOfThoughtHeader>Thought process</ChainOfThoughtHeader>
                    <ChainOfThoughtContent>
                      {toolParts.map((tp, idx) => {
                        const toolName = getToolOrDynamicToolName(tp);
                        const isWebSearch = toolName === "web_search";

                        // For OpenAI's built-in web search tool, the model may use actions like
                        // `openPage` / `findInPage`. Those are useful for debugging but feel like
                        // “empty steps” in a user-facing thought thread, so we hide them.
                        const webSearchActionType =
                          isWebSearch &&
                          tp.input &&
                          typeof tp.input === "object" &&
                          "action" in tp.input
                            ? (
                                tp.input as {
                                  action?: { type?: string; query?: string; url?: string | null };
                                }
                              ).action?.type
                            : undefined;
                        if (isWebSearch && webSearchActionType && webSearchActionType !== "search") {
                          return null;
                        }

                        const label =
                          isWebSearch
                            ? "Web search"
                            : toolName === "getTime"
                              ? "Get server time"
                              : toolName === "getWeather"
                                ? "Check weather"
                                : toolName === "summarizeAttachments"
                                  ? "Summarize attachments"
                                  : toolName.replaceAll("_", " ");

                        const Icon =
                          toolName === "web_search"
                            ? SearchIcon
                            : toolName === "getTime"
                              ? ClockIcon
                              : toolName === "getWeather"
                                ? CloudSunIcon
                                : toolName === "summarizeAttachments"
                                  ? FileTextIcon
                                  : WrenchIcon;

                        const status: "complete" | "active" | "pending" = (() => {
                          if (
                            tp.state === "output-available" ||
                            tp.state === "output-error"
                          ) {
                            return "complete";
                          }
                          if (
                            tp.state === "input-streaming" ||
                            tp.state === "input-available"
                          ) {
                            return "active";
                          }
                          return "pending";
                        })();

                        const query =
                          isWebSearch &&
                          tp.input &&
                          typeof tp.input === "object"
                            ? (tp.input as { action?: { query?: string } }).action
                                ?.query
                            : undefined;

                        // For web search, show *that call's* domains (not global sources),
                        // so multiple searches feel like a "thread" of actions.
                        const hostnames =
                          isWebSearch &&
                          tp.output &&
                          typeof tp.output === "object"
                            ? (
                                (tp.output as {
                                  sources?: Array<{ type?: string; url?: string }>;
                                }).sources ?? []
                              )
                                .map((s) => {
                                  if (s?.type !== "url" || !s.url) return null;
                                  try {
                                    return new URL(s.url).hostname;
                                  } catch {
                                    return null;
                                  }
                                })
                                .filter((h): h is string => Boolean(h))
                            : [];

                        // De-dupe hostnames while preserving order for this step.
                        const seen = new Set<string>();
                        const uniqHosts = hostnames.filter((h) => {
                          if (seen.has(h)) return false;
                          seen.add(h);
                          return true;
                        });

                        return (
                          <ChainOfThoughtStep
                            key={`${message.id}-toolstep-${idx}`}
                            className={idx === toolParts.length - 1 ? "pb-0" : "pb-3"}
                            icon={Icon}
                            label={label}
                            description={query}
                            status={status}
                          >
                            {uniqHosts.length > 0 && (
                              <ChainOfThoughtSearchResults>
                                {uniqHosts.slice(0, 8).map((h) => (
                                  <ChainOfThoughtSearchResult key={h}>
                                    {h}
                                  </ChainOfThoughtSearchResult>
                                ))}
                              </ChainOfThoughtSearchResults>
                            )}
                            {/* If the tool completed but no sources were returned, make that explicit. */}
                            {toolName === "web_search" &&
                              status === "complete" &&
                              uniqHosts.length === 0 && (
                                <div className="text-muted-foreground text-xs">
                                  No sources returned for this step.
                                </div>
                              )}
                            {/* Surface tool errors without dumping full debug output. */}
                            {"errorText" in tp && tp.errorText ? (
                              <div className="text-destructive text-xs">
                                {tp.errorText}
                              </div>
                            ) : null}
                          </ChainOfThoughtStep>
                        );
                      })}
                    </ChainOfThoughtContent>
                  </ChainOfThought>
                );
              }

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


