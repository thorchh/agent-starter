"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextTrigger,
} from "@/components/ai-elements/context";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageParts } from "@/components/chat/MessageParts";
import { BugIcon, CopyIcon, PencilIcon, SearchIcon, MenuIcon } from "lucide-react";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { OpenAI, Google, Groq, Moonshot, Qwen, Meta } from "@lobehub/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  deriveVisiblePath,
  getParentId,
  getSiblingsForMessage,
  mergeMessagesById,
  parentKeyFromParentId,
  ROOT_PARENT_ID,
  type BranchSelectionByParentKey,
  withBranchingMetadata,
} from "@/lib/chat/branching";

const SUGGESTIONS = [
  "🍓 How many r’s are in strawberry?",
  "🪐 Explain black holes like I’m five.",
  "🌍 Pick a random city and its fun fact.",
  "✨ Give me a surprising angle.",
];

export function ChatClient(props: { id: string; initialMessages: UIMessage[] }) {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0]!.id);
  const [useSearch, setUseSearch] = useState(false);
  const [debug, setDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Full message tree (includes branches). `useChat().messages` can be truncated
  // during regenerate; we keep a merged superset here.
  const [historicalMessages, setHistoricalMessages] = useState<UIMessage[]>(() => {
    const base = props.initialMessages;
    // Backward-compatible: infer parentId for legacy linear chats.
    return base.map((m, i) => {
      const hasParent = getParentId(m) !== undefined;
      if (hasParent) return m;
      const inferredParentId: string | null =
        i === 0 ? ROOT_PARENT_ID : base[i - 1]?.id ?? ROOT_PARENT_ID;
      return withBranchingMetadata(m, { parentId: inferredParentId });
    });
  });

  const [branchSelection, setBranchSelection] = useState<BranchSelectionByParentKey>(() => {
    try {
      const raw = localStorage.getItem(`chat:branchSelection:${props.id}`);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return {};
      return parsed as BranchSelectionByParentKey;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        `chat:branchSelection:${props.id}`,
        JSON.stringify(branchSelection)
      );
    } catch {
      // ignore
    }
  }, [branchSelection, props.id]);

  const [editingUserMessageId, setEditingUserMessageId] = useState<string | null>(
    null
  );
  const [editingDraft, setEditingDraft] = useState<string>("");

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      // Docs pattern: send only the last message; server loads + persists history.
      // Important: `useChat` may not pick up transport changes after initialization.
      // So we pass per-request options (model/useSearch) via sendMessage({ body })
      // and merge them here to ensure server routing matches the current UI selection.
      prepareSendMessagesRequest({ messages, id, body }) {
        const extra = (body ?? {}) as {
          model?: string;
          useSearch?: boolean;
          mode?: "append" | "regenerate";
          parentId?: string | null;
          history?: UIMessage[];
        };
        return {
          body: {
            message: messages[messages.length - 1],
            id,
            model: extra.model,
            useSearch: extra.useSearch,
            mode: extra.mode,
            parentId: extra.parentId,
            history: extra.history,
          },
        };
      },
    });
  }, []);

  const { messages, setMessages, sendMessage, status, regenerate } = useChat({
    id: props.id,
    messages: props.initialMessages,
    transport,
    onError: (e) => {
      console.error("[ChatClient] useChat onError:", e.message);
      setError(e.message);
    },
  });

  // The assistant message streamed back from the server does not currently include
  // our branching metadata (we add that during persistence on the server). If we
  // treat those as "root" children, the branch UI can incorrectly group a user
  // message and its assistant reply as siblings. To keep the UI correct while
  // streaming, infer missing parentId based on the current linear message order.
  const normalizedLiveMessages = useMemo(() => {
    const out: UIMessage[] = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]!;
      const hasParent = getParentId(m) !== undefined;
      if (hasParent) {
        out.push(m);
        continue;
      }
      const inferredParentId: string | null =
        i === 0 ? ROOT_PARENT_ID : messages[i - 1]?.id ?? ROOT_PARENT_ID;
      out.push(withBranchingMetadata(m, { parentId: inferredParentId }));
    }
    return out;
  }, [messages]);

  // Derive the full message tree without syncing state in an effect (eslint rule in this repo).
  const allMessages = useMemo(
    () => mergeMessagesById(historicalMessages, normalizedLiveMessages),
    [historicalMessages, normalizedLiveMessages]
  );

  const visibleMessages = useMemo(
    () => deriveVisiblePath(allMessages, branchSelection),
    [allMessages, branchSelection]
  );

  // When a response finishes streaming, the server has persisted the chat.
  // Tell the sidebar to refresh its list so the chat appears/highlights without reload.
  const lastNotifiedMessageCountRef = useRef<number>(allMessages.length);
  useEffect(() => {
    if (status !== "ready") return;
    if (allMessages.length <= 0) return;
    if (allMessages.length === lastNotifiedMessageCountRef.current) return;

    lastNotifiedMessageCountRef.current = allMessages.length;
    window.dispatchEvent(new Event("chats:changed"));
  }, [status, allMessages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K: New chat
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/chat");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Clean up empty chats when navigating away
  useEffect(() => {
    const chatId = props.id;
    const wasInitiallyEmpty = props.initialMessages.length === 0;

    return () => {
      // If chat was empty when we loaded it and is still empty when we leave, delete it
      if (wasInitiallyEmpty && allMessages.length === 0) {
        fetch(`/api/chats/${chatId}`, { method: "DELETE" }).catch(() => {
          // Ignore errors - chat might already be deleted or saved with messages
        });
      }
    };
  }, [props.id, props.initialMessages.length, allMessages.length]);

  const canNewChat = status === "ready";

  const contextEstimate = useMemo(() => {
    const inputTokens = visibleMessages
      .filter((m) => m.role === "user")
      .flatMap((m) => m.parts)
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("").length / 4;

    const outputTokens = visibleMessages
      .filter((m) => m.role === "assistant")
      .flatMap((m) => m.parts)
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("").length / 4;

    const usedTokens = Math.ceil(inputTokens + outputTokens);
    const maxOutputTokens = 128_000;

    return {
      usedTokens,
      maxOutputTokens,
      usage: {
        inputTokens: Math.ceil(inputTokens),
        outputTokens: Math.ceil(outputTokens),
        totalTokens: Math.ceil(inputTokens + outputTokens),
      },
    };
  }, [visibleMessages]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;

    setError(null);

    // Attach new user message to the last visible assistant (or root if empty).
    const lastVisible = visibleMessages.at(-1) ?? null;
    const parentId: string | null =
      !lastVisible
        ? ROOT_PARENT_ID
        : lastVisible.role === "assistant"
          ? lastVisible.id
          : (getParentId(lastVisible) ?? ROOT_PARENT_ID);

    const outgoing: UIMessage = withBranchingMetadata(
      {
        id: nanoid(),
        role: "user",
        parts: [
          ...(message.files ?? []),
          ...(message.text?.trim()
            ? [{ type: "text" as const, text: message.text.trim() }]
            : hasAttachments
              ? [{ type: "text" as const, text: "Sent with attachments." }]
              : []),
        ],
      },
      { parentId }
    );

    // Clear input immediately to provide instant visual feedback
    setInput("");

    try {
      // Optimistically switch this parent to the newest sibling (the one we're creating).
      setBranchSelection((prev) => ({
        ...prev,
        [parentKeyFromParentId(parentId)]: 1_000_000_000,
      }));
      setHistoricalMessages((prev) => mergeMessagesById(prev, [outgoing]));

      // Keep `useChat` state aligned with the visible branch tip (helps regenerate semantics).
      setMessages(visibleMessages);

      await sendMessage(outgoing, {
        body: { model, useSearch, mode: "append", parentId, history: visibleMessages },
      });
    } catch (e) {
      console.error("[ChatClient] sendMessage failed:", e);
      // Error is handled by onError callback in useChat, which sets error state
      setError(e instanceof Error ? e.message : "Failed to send message");
    }
  };

  const handleEditUserMessage = async (args: { message: UIMessage; text: string }) => {
    const original = args.message;
    const nextText = args.text.trim();
    if (!nextText) return;
    if (status !== "ready") return;
    if (original.role !== "user") return;

    const parentId = (getParentId(original) ?? ROOT_PARENT_ID) as string | null;
    const parentKey = parentKeyFromParentId(parentId);

    const edited: UIMessage = withBranchingMetadata(
      {
        id: nanoid(),
        role: "user",
        parts: [
          // Preserve everything except existing text parts; re-add edited text at the end.
          ...original.parts.filter((p) => p.type !== "text"),
          { type: "text" as const, text: nextText },
        ],
      },
      { parentId, editedFromId: original.id }
    );

    const nextSelection: BranchSelectionByParentKey = {
      ...branchSelection,
      [parentKey]: 1_000_000_000, // clamp-to-latest
    };
    const nextAll = mergeMessagesById(allMessages, [edited]);
    const nextVisible = deriveVisiblePath(nextAll, nextSelection);

    setBranchSelection(nextSelection);
    setHistoricalMessages(nextAll);
    setMessages(nextVisible);

    try {
      await sendMessage(edited, {
        body: { model, useSearch, mode: "append", parentId, history: visibleMessages },
      });
    } catch (e) {
      console.error("[ChatClient] edit sendMessage failed:", e);
      setError(e instanceof Error ? e.message : "Failed to edit message");
    }
  };

  const getTextFromMessage = (m: UIMessage) =>
    m.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("")
      .trim();

  const handleRetryLastMessage = () => {
    setError(null);
    const lastMessage = visibleMessages.at(-1);
    if (!lastMessage) return;

    // If last message is from user, just retry sending
    if (lastMessage.role === "user") {
      const parentId = getParentId(lastMessage) ?? ROOT_PARENT_ID;
      setMessages(visibleMessages);
      sendMessage(lastMessage, {
        body: { model, useSearch, mode: "append", parentId, history: visibleMessages },
      }).catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to retry message");
      });
      return;
    }

    // If last message is assistant (error during generation), regenerate it
    if (lastMessage.role === "assistant") {
      const retryParentUserId = getParentId(lastMessage) ?? null;
      if (typeof retryParentUserId === "string") {
        setBranchSelection((prev) => ({
          ...prev,
          [parentKeyFromParentId(retryParentUserId)]: 1_000_000_000,
        }));
        setMessages(visibleMessages);
        regenerate({
          messageId: lastMessage.id,
          body: {
            id: props.id,
            model,
            useSearch,
            mode: "regenerate",
            parentId: retryParentUserId,
            history: visibleMessages,
          },
        });
      }
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans selection:bg-primary/10 selection:text-primary">
      <ChatSidebar
        activeChatId={props.id}
        className="hidden md:flex h-full"
      />
      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        {/* Pinned header (app-like) */}
        <div className="sticky top-0 z-20 w-full border-b bg-background">
          <div className="mx-auto w-full max-w-3xl px-4 py-3 md:px-6 flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="md:hidden -ml-2 p-2 text-muted-foreground hover:text-foreground"
                >
                  <MenuIcon className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <ChatSidebar
                  activeChatId={props.id}
                  className="w-full border-none"
                />
              </SheetContent>
            </Sheet>
            <ChatHeader
              canNewChat={canNewChat}
              className="px-0 py-0 flex-1"
              subtitle=""
              title=""
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4">
            <Conversation className="flex-1">
              {/* Add bottom padding so the floating input bubble never covers content */}
              <ConversationContent className="gap-8 px-0 py-8 pb-40">
                {visibleMessages.length === 0 ? (
                  <div className="flex min-h-[calc(100vh-260px)] w-full flex-col items-center justify-center gap-4 py-12 text-center animate-fade-in">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-2xl text-muted-foreground">🌿</div>
                      <div className="mx-auto max-w-sm space-y-1">
                        <h2 className="text-lg font-semibold tracking-tight text-foreground">
                          Start a chat
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          Ask anything.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  visibleMessages.map((message) => (
                    (() => {
                      const { siblings, parentKey, index } = getSiblingsForMessage(
                        allMessages,
                        message
                      );

                      const lastVisibleId = visibleMessages.at(-1)?.id;
                      const hasBranches = siblings.length > 1;

                      const renderOne = (m: UIMessage) => {
                        const isSelected = m.id === message.id;
                        const isLastMessage = Boolean(isSelected && m.id === lastVisibleId);

                        const retryParentUserId =
                          m.role === "assistant"
                            ? (getParentId(m) ?? null)
                            : null;

                        return (
                          <MessageParts
                            key={m.id}
                            debug={debug}
                            isLastMessage={isLastMessage}
                            message={m}
                            userEdit={
                              m.role === "user" && editingUserMessageId === m.id
                                ? {
                                  isEditing: true,
                                  draft: editingDraft,
                                  onDraftChange: setEditingDraft,
                                  onCancel: () => {
                                    setEditingUserMessageId(null);
                                    setEditingDraft("");
                                  },
                                  onSave: (text) => {
                                    setEditingUserMessageId(null);
                                    setEditingDraft("");
                                    handleEditUserMessage({ message: m, text });
                                  },
                                }
                                : undefined
                            }
                            onRetry={
                              isLastMessage &&
                              m.role === "assistant" &&
                              typeof retryParentUserId === "string"
                                ? () => {
                                  setBranchSelection((prev) => ({
                                    ...prev,
                                    [parentKeyFromParentId(retryParentUserId)]: 1_000_000_000,
                                  }));
                                  setMessages(visibleMessages);
                                  regenerate({
                                    messageId: m.id,
                                    body: {
                                      id: props.id,
                                      model,
                                      useSearch,
                                      mode: "regenerate",
                                      parentId: retryParentUserId,
                                      history: visibleMessages,
                                    },
                                  });
                                }
                                : undefined
                            }
                            status={status}
                          />
                        );
                      };

                      if (!hasBranches) {
                        return (
                          <div key={message.id} className="flex flex-col">
                            {renderOne(message)}
                            {message.role === "user" && !(editingUserMessageId === message.id) && (
                              <div className="mt-1 ml-auto inline-flex items-center gap-1 text-muted-foreground">
                                <MessageAction
                                  label="Copy"
                                  onClick={() => {
                                    const t = getTextFromMessage(message);
                                    if (t) navigator.clipboard.writeText(t);
                                  }}
                                >
                                  <CopyIcon className="size-3.5" />
                                </MessageAction>
                                <MessageAction
                                  label="Edit"
                                  onClick={() => {
                                    setEditingUserMessageId(message.id);
                                    setEditingDraft(getTextFromMessage(message));
                                  }}
                                >
                                  <PencilIcon className="size-3.5" />
                                </MessageAction>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <MessageBranch
                          key={`branch-${parentKey}-${index}`}
                          defaultBranch={index}
                          onBranchChange={(branchIndex) => {
                            setBranchSelection((prev) => ({
                              ...prev,
                              [parentKey]: branchIndex,
                            }));
                          }}
                        >
                          <MessageBranchContent>
                            {siblings.map((sib) => renderOne(sib))}
                          </MessageBranchContent>
                          {!(message.role === "user" && editingUserMessageId === message.id) && (
                            <div
                              className={cn(
                                "mt-1 inline-flex items-center gap-1 text-muted-foreground",
                                message.role === "user" ? "ml-auto" : "mr-auto"
                              )}
                            >
                              {message.role === "user" && (
                                <>
                                  <MessageAction
                                    label="Copy"
                                    onClick={() => {
                                      const t = getTextFromMessage(message);
                                      if (t) navigator.clipboard.writeText(t);
                                    }}
                                  >
                                    <CopyIcon className="size-3.5" />
                                  </MessageAction>
                                  <MessageAction
                                    label="Edit"
                                    onClick={() => {
                                      setEditingUserMessageId(message.id);
                                      setEditingDraft(getTextFromMessage(message));
                                    }}
                                  >
                                    <PencilIcon className="size-3.5" />
                                  </MessageAction>
                                </>
                              )}
                              <MessageBranchSelector from={message.role} className="w-fit">
                                <MessageBranchPrevious />
                                <MessageBranchPage />
                                <MessageBranchNext />
                              </MessageBranchSelector>
                            </div>
                          )}
                        </MessageBranch>
                      );
                    })()
                  ))
                )}

                {(status === "submitted" ||
                  (status === "streaming" && visibleMessages.at(-1)?.role === "user")) && (
                  <Loader />
                )}
              </ConversationContent>
              <ConversationScrollButton className="bottom-32" />
            </Conversation>

            {error && (
              <div className="mx-auto mt-4 w-full max-w-3xl animate-fade-in">
                <Alert variant="destructive">
                  <AlertDescription className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium flex-1">{error}</span>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRetryLastMessage}
                        className="h-7 text-xs"
                      >
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setError(null)}
                        className="h-7 text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>

        {visibleMessages.length === 0 && (
          <div className="w-full px-4 pb-3">
            <div className="mx-auto w-full max-w-3xl">
              <div
                className="relative"
                style={{
                  maskImage:
                    "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)",
                }}
              >
                <Suggestions className="py-1">
                  {SUGGESTIONS.map((text) => (
                    <Suggestion
                      key={text}
                      suggestion={text}
                      onClick={(s) => setInput(s)}
                      className="transition-colors"
                    />
                  ))}
                </Suggestions>
              </div>
            </div>
          </div>
        )}

        {/* Floating input bubble like ChatGPT (no blur / no bottom background). */}
        <div className="z-10 w-full bg-gradient-to-t from-background via-background to-transparent px-4 pb-6 pt-2">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput
              key={props.id}
              className="w-full rounded-3xl border border-border bg-card shadow-xl shadow-black/5 transition-all duration-300"
                      accept="image/*,text/*,application/pdf"
              globalDrop
                      maxFileSize={20 * 1024 * 1024}
              multiple
              onSubmit={handleSubmit}
            >
              <PromptInputHeader className="peer empty:hidden px-0 pb-0">
                <PromptInputAttachments className="pb-0">
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
              </PromptInputHeader>

              <PromptInputBody className="peer-empty:[&>textarea]:pt-5 peer-empty:[&>textarea]:pb-0 peer-empty:[&>textarea]:min-h-[52px]">
                <PromptInputTextarea
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  value={input}
                  className="min-h-[48px] pl-5 py-3 text-base"
                />
              </PromptInputBody>

              <PromptInputFooter className="pr-3">
                <PromptInputTools className="min-w-0 flex-1 overflow-hidden">
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>

                  <PromptInputSelect onValueChange={setModel} value={model}>
                    <PromptInputSelectTrigger className="h-8">
                      <PromptInputSelectValue />
                    </PromptInputSelectTrigger>
                    <PromptInputSelectContent>
                      {MODEL_OPTIONS.map((m) => {
                        const ProviderIcon =
                          m.provider === "openai" ? OpenAI :
                          m.provider === "google" ? Google :
                          m.provider === "groq" ? Groq :
                          m.provider === "moonshot" ? Moonshot :
                          m.provider === "qwen" ? Qwen :
                          m.provider === "meta" ? Meta :
                          null;

                        return (
                          <PromptInputSelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              {ProviderIcon && <ProviderIcon size={16} />}
                              <span>{m.label}</span>
                            </div>
                          </PromptInputSelectItem>
                        );
                      })}
                    </PromptInputSelectContent>
                  </PromptInputSelect>

                  <div className="mx-1 h-4 w-px bg-border/50" />

                  <PromptInputButton
                    aria-pressed={useSearch}
                    onClick={() => setUseSearch((v) => !v)}
                    type="button"
                    variant={useSearch ? "secondary" : "ghost"}
                    className={cn(
                      "h-8 transition-all",
                      useSearch &&
                      "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                  >
                    <SearchIcon className="size-4" />
                    <span className="hidden lg:inline text-xs font-medium">Search</span>
                  </PromptInputButton>

                  <PromptInputButton
                    aria-pressed={debug}
                    onClick={() => setDebug((v) => !v)}
                    type="button"
                    variant={debug ? "secondary" : "ghost"}
                    className="h-8"
                  >
                    <BugIcon className="size-4" />
                    <span className="hidden lg:inline text-xs font-medium">Debug</span>
                  </PromptInputButton>
                </PromptInputTools>

                <div className="flex shrink-0 items-center gap-2">
                  <Context
                    maxOutputTokens={contextEstimate.maxOutputTokens}
                    usedTokens={contextEstimate.usedTokens}
                    usage={contextEstimate.usage}
                    modelId={model}
                  >
                    <ContextTrigger className="h-8" />
                    <ContextContent align="end">
                      <ContextContentHeader />
                      <ContextContentBody>
                        <ContextInputUsage />
                        <ContextOutputUsage />
                        <ContextContentFooter />
                      </ContextContentBody>
                    </ContextContent>
                  </Context>
                  <PromptInputSubmit status={status} className="size-9 rounded-full shrink-0" />
                </div>
              </PromptInputFooter>
            </PromptInput>
            <div className="mt-3 text-center text-[10px] font-medium text-muted-foreground opacity-60">
              AI can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
