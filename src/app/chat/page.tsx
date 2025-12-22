"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
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
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";
import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextTrigger,
} from "@/components/ai-elements/context";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageParts } from "@/components/chat/MessageParts";
import { BugIcon, RefreshCcwIcon, SearchIcon } from "lucide-react";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { createLocalStorageStore } from "@/lib/chat/store/localStorageStore";
import type { ChatThreadState } from "@/lib/chat/store/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/**
 * NOTE: This is UI-local on purpose for the first milestone.
 *
 * Once `src/lib/ai/models.ts` exists (ai-layer todo), we’ll import the same
 * allowlisted models here to keep UI + server in sync.
 */
const SUGGESTIONS = [
  "Summarize what you can do.",
  "What time is it on the server?",
  "Pick a random city and show the weather (tool).",
  "Write a TypeScript function and format it as markdown.",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0]!.id);
  const [useSearch, setUseSearch] = useState(false);
  const [debug, setDebug] = useState(false);
  const [hasLoadedFromStore, setHasLoadedFromStore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    onError: (e) => {
      // Keep the UI simple: show a single error banner near the input.
      // This is especially helpful when OPENAI_API_KEY is missing in local dev.
      setError(e.message);
    },
  });

  const canClear = messages.length > 0 && status === "ready";
  const store = useMemo(() => createLocalStorageStore(), []);

  const contextEstimate = useMemo(() => {
    // This is a lightweight starter: we don't yet persist/stream real token usage.
    // Provide a rough estimate so the Context UI is useful immediately.
    const joined = messages
      .flatMap((m) => m.parts)
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    const usedTokens = Math.ceil(joined.length / 4); // common heuristic
    const maxTokens = 128_000; // conservative default; can be made model-aware later
    return { usedTokens, maxTokens };
  }, [messages]);

  // Load persisted conversation once on mount (client-only).
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const state = await store.loadLastThread();
      if (!isMounted) return;
      if (state?.messages?.length) {
        setMessages(state.messages);
      }
      setHasLoadedFromStore(true);
    })();
    return () => {
      isMounted = false;
    };
  }, [setMessages, store]);

  // Persist whenever messages change (after initial load).
  useEffect(() => {
    if (!hasLoadedFromStore) return;
    const state: ChatThreadState = {
      thread: {
        id: "local",
        title: "Local conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      messages,
    };
    store.saveThread(state);
  }, [hasLoadedFromStore, messages, store]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;

    setError(null);

    // IMPORTANT: We pass `model` in the body. The server will validate
    // against an allowlist (see `src/lib/ai/models.ts` in the plan).
    sendMessage(
      {
        text: message.text || (hasAttachments ? "Sent with attachments." : ""),
        files: message.files,
      },
      {
        body: { model, useSearch },
      }
    );

    setInput("");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans selection:bg-primary/10 selection:text-primary">
      {/* Pinned header (app-like) */}
      <div className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-4xl px-4 py-3 md:px-6">
          <ChatHeader
            canClear={canClear}
            className="px-0 py-0"
            onClear={() => {
              setMessages([]);
              store.clear();
            }}
            subtitle="AI Elements UI • AI SDK streaming • server-side tools"
            title="Agent Starter"
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 md:px-0">
        <Conversation className="flex-1">
          {/* Add bottom padding so the floating input bubble never covers content */}
          <ConversationContent className="gap-8 px-0 py-8 pb-40">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-8 py-20 text-center animate-fade-in">
                <ConversationEmptyState
                  title="Start a conversation"
                  description="Try a prompt below or type your own."
                  className="max-w-md"
                />

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
                  onRetry={message.role === "assistant" ? regenerate : undefined}
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
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Floating input bubble like ChatGPT (no blur / no bottom background). */}
        <div className="sticky bottom-0 z-10 -mx-4 px-4 pb-6 pt-12 md:-mx-0 md:px-0 bg-gradient-to-t from-background via-background to-transparent">
          <PromptInput
            className="mx-auto w-full max-w-3xl rounded-3xl border bg-card shadow-xl shadow-black/5 ring-1 ring-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300"
            globalDrop
            multiple
            onSubmit={handleSubmit}
          >
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>

            <PromptInputBody>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                value={input}
                className="min-h-[52px] py-4 text-base"
              />
            </PromptInputBody>

            <PromptInputFooter>
              <PromptInputTools>
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

                <Context
                  maxTokens={contextEstimate.maxTokens}
                  usedTokens={contextEstimate.usedTokens}
                >
                  <ContextTrigger className="h-8" />
                  <ContextContent align="end">
                    <ContextContentHeader />
                    <ContextContentBody>
                      <div className="text-muted-foreground text-xs">
                        Token usage is an estimate in this starter. Stream real usage
                        later via AI SDK `messageMetadata`.
                      </div>
                    </ContextContentBody>
                  </ContextContent>
                </Context>

                <div className="h-4 w-px bg-border/50 mx-1" />

                <PromptInputButton
                  aria-pressed={useSearch}
                  onClick={() => setUseSearch((v) => !v)}
                  type="button"
                  variant={useSearch ? "secondary" : "ghost"}
                  className={cn("h-8 transition-all", useSearch && "bg-primary/10 text-primary hover:bg-primary/15")}
                >
                  <SearchIcon className="size-4" />
                  <span className="text-xs font-medium">Search</span>
                </PromptInputButton>

                <PromptInputButton
                  aria-pressed={debug}
                  onClick={() => setDebug((v) => !v)}
                  type="button"
                  variant={debug ? "secondary" : "ghost"}
                  className="h-8"
                >
                  <BugIcon className="size-4" />
                  <span className="text-xs font-medium">Debug</span>
                </PromptInputButton>

                <PromptInputButton
                  onClick={() => regenerate()}
                  type="button"
                  variant="ghost"
                  className="h-8"
                >
                  <RefreshCcwIcon className="size-4" />
                  <span className="text-xs font-medium">Retry</span>
                </PromptInputButton>
              </PromptInputTools>

              <PromptInputSubmit status={status} className="rounded-full size-9" />
            </PromptInputFooter>
          </PromptInput>
          <div className="text-center text-[10px] text-muted-foreground mt-3 font-medium opacity-60">
            AI can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}


