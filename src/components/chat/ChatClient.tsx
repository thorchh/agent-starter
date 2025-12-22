"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
import { BugIcon, SearchIcon } from "lucide-react";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            id,
            model,
            useSearch,
          },
        };
      },
    });
  }, [model, useSearch]);

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    id: props.id,
    messages: props.initialMessages,
    transport,
    onError: (e) => setError(e.message),
  });

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
    const maxTokens = 128_000;

    return {
      usedTokens,
      maxTokens,
      usage: {
        inputTokens: Math.ceil(inputTokens),
        outputTokens: Math.ceil(outputTokens),
        totalTokens: Math.ceil(inputTokens + outputTokens),
      },
    };
  }, [messages]);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;

    setError(null);

    // We rely on transport.prepareSendMessagesRequest to attach { id, model, useSearch }.
    sendMessage({
      text: message.text || (hasAttachments ? "Sent with attachments." : ""),
      files: message.files,
    });

    setInput("");
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-primary/10 selection:text-primary">
      <ChatSidebar activeChatId={props.id} className="hidden md:flex" />

      <div className="flex min-h-screen w-full flex-1 flex-col">
        {/* Pinned header (app-like) */}
        <div className="sticky top-0 z-20 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto w-full max-w-4xl px-4 py-3 md:px-6">
            <ChatHeader
              canNewChat={canNewChat}
              className="px-0 py-0"
              onNewChat={() => {
                setMessages([]);
                router.push("/chat");
              }}
              subtitle="AI Elements UI • AI SDK streaming • doc-aligned persistence"
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
              <AlertDescription className="text-sm font-medium">
                {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Floating input bubble like ChatGPT (no blur / no bottom background). */}
        <div className="sticky bottom-0 z-10 -mx-4 px-4 pb-6 pt-12 md:-mx-0 md:px-0 bg-gradient-to-t from-background via-background to-transparent">
          <PromptInput
            className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card shadow-xl shadow-black/5 transition-all duration-300"
            globalDrop
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
              </PromptInputTools>

              <div className="flex items-center gap-2">
                <Context
                  maxTokens={contextEstimate.maxTokens}
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
                <PromptInputSubmit status={status} className="size-9 rounded-full" />
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


