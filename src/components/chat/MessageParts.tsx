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
  ChainOfThoughtImage,
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
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  Maximize2Icon,
  RefreshCcwIcon,
  SearchIcon,
  WrenchIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMessageTimestamp, hasTimestamp, hasModel } from "@/lib/chat/message-types";

export type MessagePartsProps = ComponentProps<"div"> & {
  message: UIMessage;
  status: ChatStatus;
  isLastMessage: boolean;
  onRetry?: () => void;
  userEdit?: {
    isEditing: boolean;
    draft: string;
    onDraftChange: (v: string) => void;
    onCancel: () => void;
    onSave: (text: string) => void;
  };
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
  userEdit,
  debug = false,
  ...props
}: MessagePartsProps) {
  type Part = UIMessage["parts"][number];

  const normalizeReasoningText = (text: string) => {
    // Some providers/models emit JSON-escaped newlines in reasoning (e.g. "\\n\\n").
    // Streamdown expects real newlines to render markdown spacing correctly.
    return text.includes("\\n") ? text.replaceAll("\\n", "\n") : text;
  };

  function ThoughtImageItem(props: {
    part: Extract<Part, { type: "file" }>;
    messageId: string;
    index: number;
  }) {
    const { part, messageId, index } = props;
    const mediaType = part.mediaType ?? "image/png";
    const filename = part.filename || `image-${index + 1}`;

    const uint8Array = (part as unknown as { uint8Array?: Uint8Array }).uint8Array;
    const blobUrl = useMemo(() => {
      if (!uint8Array) return null;
      if (!mediaType.startsWith("image/")) return null;
      try {
        const bytes = Uint8Array.from(uint8Array);
        const blob = new Blob([bytes], { type: mediaType });
        return URL.createObjectURL(blob);
      } catch {
        return null;
      }
    }, [mediaType, uint8Array]);

    useEffect(() => {
      return () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      };
    }, [blobUrl]);

    const imageUrl = (typeof part.url === "string" && part.url.length > 0
      ? part.url
      : blobUrl) as string | null;

    if (!imageUrl) return null;

    return (
      <ChainOfThoughtImage
        key={`${messageId}-thought-image-${index}`}
        caption={filename}
      >
        <img
          alt={filename}
          src={imageUrl}
          className="max-h-80 w-auto max-w-full rounded-md object-contain"
        />
      </ChainOfThoughtImage>
    );
  }

  function AssistantImageCard(props: {
    part: Extract<Part, { type: "file" }>;
    index: number;
  }) {
    const { part, index } = props;
    const [open, setOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<null | "copied" | "error">(null);

    const mediaType = part.mediaType ?? "image/png";
    const filename = part.filename || `image-${index + 1}`;

    const uint8Array = (part as unknown as { uint8Array?: Uint8Array }).uint8Array;
    const blobUrl = useMemo(() => {
      if (!uint8Array) return null;
      if (!mediaType.startsWith("image/")) return null;
      try {
        const bytes = Uint8Array.from(uint8Array);
        const blob = new Blob([bytes], { type: mediaType });
        return URL.createObjectURL(blob);
      } catch {
        return null;
      }
    }, [mediaType, uint8Array]);

    useEffect(() => {
      return () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      };
    }, [blobUrl]);

    const imageUrl = (typeof part.url === "string" && part.url.length > 0
      ? part.url
      : blobUrl) as string | null;

    async function copyToClipboard() {
      setCopyStatus(null);
      try {
        if (!imageUrl) throw new Error("Missing image URL");
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        // ClipboardItem is not available in all browsers.
        const ClipboardItemCtor = (window as unknown as { ClipboardItem?: typeof ClipboardItem })
          .ClipboardItem;
        if (!ClipboardItemCtor || !navigator.clipboard?.write) {
          throw new Error("Clipboard image copy not supported in this browser");
        }
        await navigator.clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })]);
        setCopyStatus("copied");
      } catch (err) {
        console.warn("[image] copy failed:", err);
        setCopyStatus("error");
      } finally {
        window.setTimeout(() => setCopyStatus(null), 1500);
      }
    }

    return (
      <>
        <div className="group relative w-full overflow-hidden rounded-2xl border bg-muted/10">
          <button
            type="button"
            className="block w-full"
            onClick={() => setOpen(true)}
            aria-label="Open image"
          >
            {imageUrl ? (
              <img
                alt={filename}
                src={imageUrl}
                className="w-full max-h-[520px] object-contain bg-muted/30"
              />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
                Image unavailable
              </div>
            )}
          </button>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <ImageIcon className="size-3.5" />
              <span className="truncate max-w-[220px]">{filename}</span>
            </div>
            <div className="pointer-events-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full bg-background/80 backdrop-blur"
                onClick={() => setOpen(true)}
                aria-label="Expand"
              >
                <Maximize2Icon className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full bg-background/80 backdrop-blur"
                onClick={copyToClipboard}
                aria-label="Copy image"
                disabled={!imageUrl}
              >
                <CopyIcon className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full bg-background/80 backdrop-blur"
                asChild
                aria-label="Download image"
                disabled={!imageUrl}
              >
                <a href={imageUrl ?? undefined} download={filename}>
                  <DownloadIcon className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>

          {copyStatus && (
            <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur">
              {copyStatus === "copied" ? "Copied" : "Copy failed"}
            </div>
          )}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[96vw] max-w-[min(96vw,1200px)] sm:max-w-[min(96vw,1400px)]">
            <DialogHeader>
              <DialogTitle className="truncate">{filename}</DialogTitle>
            </DialogHeader>
            <div className="flex max-h-[82vh] items-center justify-center overflow-hidden rounded-xl bg-muted/30">
              {imageUrl ? (
                <img
                  alt={filename}
                  src={imageUrl}
                  className="max-h-[82vh] w-auto max-w-full object-contain"
                />
              ) : (
                <div className="py-10 text-muted-foreground text-sm">Image unavailable</div>
              )}
            </div>
            <DialogFooter>
              <div className="flex w-full items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="button" variant="secondary" onClick={copyToClipboard} disabled={!imageUrl}>
                  <CopyIcon className="mr-2 size-4" />
                  Copy
                </Button>
                <Button type="button" asChild disabled={!imageUrl}>
                  <a href={imageUrl ?? undefined} download={filename}>
                    <DownloadIcon className="mr-2 size-4" />
                    Download
                  </a>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

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

  const userText = useMemo(() => {
    if (message.role !== "user") return "";
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("")
      .trim();
  }, [message.parts, message.role]);

  const firstUserTextPartIndex = useMemo(() => {
    if (message.role !== "user") return -1;
    return message.parts.findIndex((p) => p.type === "text");
  }, [message.parts, message.role]);

  const isEditingUser = Boolean(userEdit?.isEditing) && message.role === "user";
  const editDraft = isEditingUser ? userEdit!.draft : userText;

  const toolParts = useMemo(
    () => message.parts.filter((p) => isToolOrDynamicToolUIPart(p)),
    [message.parts]
  );

  const reasoningParts = useMemo(
    () => message.parts.filter((p) => p.type === "reasoning"),
    [message.parts]
  );

  const firstReasoningPartIndex = useMemo(() => {
    if (reasoningParts.length === 0) return -1;
    return message.parts.findIndex((p) => p.type === "reasoning");
  }, [message.parts, reasoningParts.length]);

  const lastReasoningPartIndex = useMemo(() => {
    for (let i = message.parts.length - 1; i >= 0; i--) {
      if (message.parts[i]?.type === "reasoning") return i;
    }
    return -1;
  }, [message.parts]);

  const hasReasoning = useMemo(() => {
    if (reasoningParts.length === 0) return false;
    if (reasoningParts.some((p) => p.text.trim().length > 0)) return true;
    return reasoningParts.some((p) => p.state === "streaming");
  }, [reasoningParts]);

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

  const lastThoughtPartIndex = useMemo(() => {
    return Math.max(lastToolPartIndex, lastReasoningPartIndex);
  }, [lastReasoningPartIndex, lastToolPartIndex]);

  const hasStreamingFinalTextAfterThought = useMemo(() => {
    // If the assistant is streaming text after the thought thread (reasoning/tools),
    // we treat that as "final answer streaming" and auto-collapse the thread.
    if (lastThoughtPartIndex === -1) return false;
    for (let i = lastThoughtPartIndex + 1; i < message.parts.length; i++) {
      const p = message.parts[i];
      if (p?.type === "text" && p.state === "streaming") return true;
    }
    return false;
  }, [lastThoughtPartIndex, message.parts]);

  // --- Thought thread (ChainOfThought) open/close behavior ---
  // We avoid effects here (linted in this repo) and instead derive open state:
  // - Auto-open while tools are running.
  // - Auto-collapse when final text starts streaming.
  // - Allow user override by clicking the trigger.
  const [thoughtOpenOverride, setThoughtOpenOverride] = useState<boolean | null>(
    null
  );

  const shouldShowThoughtThread =
    !debug &&
    message.role === "assistant" &&
    isLastMessage &&
    (toolParts.length > 0 || hasReasoning);

  const autoThoughtOpen =
    shouldShowThoughtThread &&
    (status === "submitted" || status === "streaming") &&
    !hasStreamingFinalTextAfterThought;

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
        // AI SDK v6 `source-document` shape does not guarantee `file`.
        // Prefer mediaType if present; fall back to title-only key.
        const mediaType =
          "mediaType" in part && typeof part.mediaType === "string"
            ? part.mediaType
            : "unknown";
        const key = `${mediaType}:${part.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push(part);
    }
    return out;
  }, [sources]);

  return (
    <div className={cn("w-full", className)} {...props}>
      {message.parts.map((part: Part, i) => {
        switch (part.type) {
          case "text": {
            const isActionPart = showActions && i === lastTextPartIndex;
            const showMetadata = isActionPart && (hasTimestamp(message) || (message.role === "assistant" && hasModel(message)));

            // Inline editing for user messages (ChatGPT-style).
            if (message.role === "user") {
              // Only render one editor bubble for the first text part.
              if (i !== firstUserTextPartIndex) return null;

              const trimmed = editDraft.trim();
              const canSave = trimmed.length > 0 && trimmed !== userText;

              return (
                <Message key={`${message.id}-user-edit`} from={message.role}>
                  <MessageContent
                    className={cn(
                      isEditingUser && "w-full max-w-3xl py-4"
                    )}
                  >
                    {isEditingUser ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          className={cn(
                            "w-full resize-none bg-transparent text-base leading-6 outline-none",
                            "min-h-[120px]"
                          )}
                          value={editDraft}
                          onChange={(e) => userEdit?.onDraftChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault();
                              userEdit?.onCancel();
                            }
                            if (
                              e.key === "Enter" &&
                              (e.metaKey || e.ctrlKey) &&
                              canSave
                            ) {
                              e.preventDefault();
                              userEdit?.onSave(trimmed);
                            }
                          }}
                          rows={Math.min(12, Math.max(2, Math.ceil(editDraft.length / 60)))}
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-full px-4"
                            onClick={() => {
                              userEdit?.onCancel();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="h-9 rounded-full px-4"
                            disabled={!canSave || status !== "ready"}
                            onClick={() => {
                              if (!canSave) return;
                              userEdit?.onSave(trimmed);
                            }}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <MessageResponse>{userText || part.text}</MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              );
            }

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
                    (<MessageResponse>{part.text}</MessageResponse>)
                  )}
                </MessageContent>
                {showMetadata && (
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
                    {hasTimestamp(message) && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {formatMessageTimestamp(message.timestamp)}
                      </span>
                    )}
                    {message.role === "assistant" && hasModel(message) && (
                      <>
                        {hasTimestamp(message) && <span>•</span>}
                        <span className="truncate" title={message.model}>
                          {message.model.split("/").pop() || message.model}
                        </span>
                      </>
                    )}
                  </div>
                )}
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
            // Render file parts as attachments. This keeps them "in-stream" so they
            // appear exactly where the SDK emitted them.
            const isOmitted =
              typeof part.url === "string" &&
              (part.url.startsWith("local-storage://omitted") ||
                part.url.startsWith("omitted://"));

            const isImage = Boolean(part.mediaType?.startsWith("image/"));

            // If we're showing the clean thought thread, and this image appeared during
            // the thought/tool/reasoning phase, render it inside the collapsible thread
            // instead of duplicating it as a standalone attachment bubble.
            if (
              !debug &&
              shouldShowThoughtThread &&
              isImage &&
              lastThoughtPartIndex !== -1 &&
              i <= lastThoughtPartIndex
            ) {
              return null;
            }

            return (
              <Message key={`${message.id}-file-${i}`} from={message.role}>
                <MessageAttachments className="mt-3">
                  {isOmitted ? (
                    <div className="space-y-2 rounded-lg border bg-muted/20 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        {part.mediaType?.startsWith("image/") ? (
                          <ImageIcon className="size-4 shrink-0" />
                        ) : part.mediaType?.includes("pdf") ? (
                          <FileTextIcon className="size-4 shrink-0" />
                        ) : (
                          <FileIcon className="size-4 shrink-0" />
                        )}
                        <span className="truncate">{part.filename || "Attachment"}</span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Content not persisted. Re-upload to reference after refresh.
                      </div>
                    </div>
                  ) : isImage && message.role === "assistant" ? (
                    <AssistantImageCard part={part} index={i} />
                  ) : (
                    <MessageAttachment data={part} />
                  )}
                </MessageAttachments>
              </Message>
            );
          }

          case "reasoning": {
            // In clean mode we show reasoning as part of a single, unified "Thought process"
            // thread (ChainOfThought) instead of rendering many separate reasoning blocks.
            if (!debug) {
              // If tools exist, we’ll render the thought thread at the first tool part.
              if (toolParts.length > 0) return null;
              // If no tools exist, render the thread once at the first reasoning part.
              if (i !== firstReasoningPartIndex) return null;

              return (
                <ChainOfThought
                  key={`${message.id}-thought-thread`}
                  className="w-full pb-2"
                  onOpenChange={setThoughtOpenOverride}
                  open={thoughtOpen}
                >
                  <ChainOfThoughtHeader>Thought process</ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    {message.parts
                      .slice(
                        Math.max(0, firstReasoningPartIndex),
                        lastReasoningPartIndex === -1
                          ? message.parts.length
                          : lastReasoningPartIndex + 1
                      )
                      .map((p, partIndexInSlice) => {
                        const absoluteIndex =
                          Math.max(0, firstReasoningPartIndex) + partIndexInSlice;

                        if (
                          p.type === "file" &&
                          typeof p.mediaType === "string" &&
                          p.mediaType.startsWith("image/") &&
                          !(
                            typeof p.url === "string" &&
                            (p.url.startsWith("omitted://") ||
                              p.url.startsWith("local-storage://omitted"))
                          )
                        ) {
                          return (
                            <ThoughtImageItem
                              key={`${message.id}-thought-image-${absoluteIndex}`}
                              part={p}
                              messageId={message.id}
                              index={absoluteIndex}
                            />
                          );
                        }

                        if (p.type === "reasoning" && p.text.trim().length > 0) {
                          // Inline (no label). Use aria-label for accessibility.
                          return (
                            <ChainOfThoughtStep
                              key={`${message.id}-reasoning-${absoluteIndex}`}
                              aria-label="Reasoning"
                              role="group"
                              status={
                                status === "streaming" &&
                                isLastMessage &&
                                message.role === "assistant" &&
                                p.state === "streaming"
                                  ? "active"
                                  : "complete"
                              }
                              isLast={absoluteIndex === lastReasoningPartIndex}
                            >
                              <div className="text-muted-foreground text-xs [&_code]:text-[11px] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted/60">
                                <MessageResponse>
                                  {normalizeReasoningText(p.text)}
                                </MessageResponse>
                              </div>
                            </ChainOfThoughtStep>
                          );
                        }

                        return null;
                      })}
                  </ChainOfThoughtContent>
                </ChainOfThought>
              );
            }

            // Debug mode: keep individual Reasoning parts to reflect the raw stream.
            // Some providers/models emit a `reasoning` part without any readable text
            // (e.g. only timing metadata). In that case, showing the collapsible UI
            // is confusing—hide it unless there is content or it's actively streaming.
            const hasReasoningText = part.text.trim().length > 0;
            if (!hasReasoningText && part.state !== "streaming") return null;

            return (
              <Reasoning
                key={`${message.id}-reasoning-${i}`}
                className="w-full"
                isStreaming={
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
                      {message.parts.map((p, partIndex) => {
                        // Render image previews that happened during the thought/tool phase.
                        if (
                          p.type === "file" &&
                          partIndex <= lastThoughtPartIndex &&
                          typeof p.mediaType === "string" &&
                          p.mediaType.startsWith("image/") &&
                          !(
                            typeof p.url === "string" &&
                            (p.url.startsWith("omitted://") ||
                              p.url.startsWith("local-storage://omitted"))
                          )
                        ) {
                          return (
                            <ThoughtImageItem
                              key={`${message.id}-thought-image-${partIndex}`}
                              part={p}
                              messageId={message.id}
                              index={partIndex}
                            />
                          );
                        }

                        // Render reasoning parts
                        if (p.type === "reasoning") {
                          if (p.text.trim().length === 0) return null;

                          return (
                            <ChainOfThoughtStep
                              key={`${message.id}-reasoning-${partIndex}`}
                              aria-label="Reasoning"
                              role="group"
                              status={
                                status === "streaming" &&
                                  isLastMessage &&
                                  message.role === "assistant" &&
                                  p.state === "streaming"
                                  ? "active"
                                  : "complete"
                              }
                              className="pb-3"
                            >
                              <div className="text-muted-foreground text-xs [&_code]:text-[11px] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-muted/60">
                                <MessageResponse>{normalizeReasoningText(p.text)}</MessageResponse>
                              </div>
                            </ChainOfThoughtStep>
                          );
                        }

                        // Render tool parts
                        if (!isToolOrDynamicToolUIPart(p)) return null;

                        const tp = p;
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

                        const toolStatus: "complete" | "active" | "pending" = (() => {
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
                            key={`${message.id}-toolstep-${partIndex}`}
                            className="pb-3"
                            icon={Icon}
                            label={label}
                            description={query}
                            status={toolStatus}
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
                              toolStatus === "complete" &&
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

            // source-* parts are rendered in the Sources footer below
            // unknown part types are ignored for now.
            return null;
          }
        }
      })}
      {message.role === "assistant" && uniqueSourcesForHeader.length > 0 && (
        <Sources>
          <SourcesTrigger count={uniqueSourcesForHeader.length} />
          {uniqueSourcesForHeader.map((part, i) => (
            <SourcesContent key={`${message.id}-source-${i}`}>
              {"url" in part ? (
                <Source href={part.url} title={part.title ?? part.url} />
              ) : (
                // `source-document` does not have an href; we display the title.
                (<Source
                  href="#"
                  title={part.title}
                  onClick={(e) => e.preventDefault()}
                />)
              )}
            </SourcesContent>
          ))}
        </Sources>
      )}
    </div>
  );
}


