"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
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
import { BugIcon, SearchIcon, MenuIcon, Sparkles } from "lucide-react";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Summarize what you can do.",
  "What time is it on the server?",
  "Pick a random city and show the weather (tool).",
  "Write a TypeScript function and format it as markdown.",
];

export function ChatClient(props: { id: string; initialMessages: UIMessage[] }) {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0]!.id);
  const [useSearch, setUseSearch] = useState(false);
  const [debug, setDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      // Docs pattern: send only the last message; server loads + persists history.
      // Important: `useChat` may not pick up transport changes after initialization.
      // So we pass per-request options (model/useSearch) via sendMessage({ body })
      // and merge them here to ensure server routing matches the current UI selection.
      prepareSendMessagesRequest({ messages, id, body }) {
        const extra = (body ?? {}) as { model?: string; useSearch?: boolean };
        return {
          body: {
            message: messages[messages.length - 1],
            id,
            model: extra.model,
            useSearch: extra.useSearch,
          },
        };
      },
    });
  }, []);

  const { messages, sendMessage, status, regenerate } = useChat({
    id: props.id,
    messages: props.initialMessages,
    transport,
    onError: (e) => {
      console.error("[ChatClient] useChat onError:", e.message);
      setError(e.message);
    },
  });

  console.log("[ChatClient] useChat initialized with id:", props.id);

  // Log status and message changes
  useEffect(() => {
    console.log("[ChatClient] Status:", status, "Messages:", messages.length);
  }, [status, messages.length]);

  // When a response finishes streaming, the server has persisted the chat.
  // Tell the sidebar to refresh its list so the chat appears/highlights without reload.
  const lastNotifiedMessageCountRef = useRef<number>(props.initialMessages.length);
  useEffect(() => {
    if (status !== "ready") return;
    if (messages.length <= 0) return;
    if (messages.length === lastNotifiedMessageCountRef.current) return;

    lastNotifiedMessageCountRef.current = messages.length;
    window.dispatchEvent(new Event("chats:changed"));
  }, [status, messages.length]);

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

  const canNewChat = status === "ready";

  const contextEstimate = useMemo(() => {
    const inputTokens = messages
      .filter((m) => m.role === "user")
      .flatMap((m) => m.parts)
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("").length / 4;

    const outputTokens = messages
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
  }, [messages]);

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log("[ChatClient] handleSubmit called", {
      text: message.text?.substring(0, 50),
      hasAttachments: Boolean(message.files?.length),
      chatId: props.id,
      messagesCount: messages.length
    });

    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;

    setError(null);

    // We rely on transport.prepareSendMessagesRequest to attach { id, model, useSearch }.
    const outgoing = {
      text: message.text || (hasAttachments ? "Sent with attachments." : ""),
      files: message.files,
    } as const;

    // Clear input immediately to provide instant visual feedback
    setInput("");
    console.log("[ChatClient] Input cleared, calling sendMessage with chatId:", props.id);

    try {
      await sendMessage(outgoing, { body: { model, useSearch } });
      console.log("[ChatClient] sendMessage completed successfully");
    } catch (e) {
      console.error("[ChatClient] sendMessage failed:", e);
      // Error is handled by onError callback in useChat, which sets error state
      setError(e instanceof Error ? e.message : "Failed to send message");
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
        <div className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto w-full max-w-4xl px-4 py-3 md:px-6 flex items-center gap-3">
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
              subtitle="AI Elements UI • AI SDK streaming • Chat persistence"
              title="Agent Starter"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          <div className="mx-auto flex w-full max-w-3xl flex-col px-4">
            <Conversation className="flex-1">
              {/* Add bottom padding so the floating input bubble never covers content */}
              <ConversationContent className="gap-8 px-0 py-8 pb-40">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-10 py-16 text-center animate-fade-in">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                        <Sparkles className="size-8" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                          How can I help you today?
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-sm">
                          Ask me anything or try one of these suggestions to get started.
                        </p>
                      </div>
                    </div>

                    <div className="w-full max-w-xl">
                      <Suggestions>
                        {SUGGESTIONS.map((text) => (
                          <Suggestion
                            key={text}
                            suggestion={text}
                            onClick={(s) => setInput(s)}
                            className="transition-all hover:scale-[1.01] active:scale-[0.99]"
                          />
                        ))}
                      </Suggestions>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageParts
                      key={message.id}
                      debug={debug}
                      isLastMessage={message.id === messages.at(-1)?.id}
                      message={message}
                      onRetry={
                        message.role === "assistant"
                          ? () =>
                            regenerate({
                              body: { id: props.id, model, useSearch },
                            })
                          : undefined
                      }
                      status={status}
                    />
                  ))
                )}

                {status === "submitted" && <Loader />}
              </ConversationContent>
              <ConversationScrollButton className="bottom-32" />
            </Conversation>

            {error && (
              <div className="mx-auto mt-4 w-full max-w-3xl animate-fade-in">
                <Alert variant="destructive">
                  <AlertDescription className="text-sm font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>

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
                      {MODEL_OPTIONS.map((m) => (
                        <PromptInputSelectItem key={m.id} value={m.id}>
                          {m.label}
                        </PromptInputSelectItem>
                      ))}
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


