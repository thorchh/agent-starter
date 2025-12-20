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
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageParts } from "@/components/chat/MessageParts";
import { RefreshCcwIcon } from "lucide-react";
import { MODEL_OPTIONS } from "@/lib/ai/models";
import { createLocalStorageStore } from "@/lib/chat/store/localStorageStore";
import type { ChatThreadState } from "@/lib/chat/store/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [hasLoadedFromStore, setHasLoadedFromStore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    api: "/api/chat",
    onError: (e) => {
      // Keep the UI simple: show a single error banner near the input.
      // This is especially helpful when OPENAI_API_KEY is missing in local dev.
      setError(e.message);
    },
  });

  const canClear = messages.length > 0 && status === "ready";
  const store = useMemo(() => createLocalStorageStore(), []);

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
        body: { model },
      }
    );

    setInput("");
  };

  return (
    <div className="relative mx-auto flex h-screen w-full max-w-4xl flex-col p-6">
      <ChatHeader
        className="mb-4 rounded-lg border bg-card/80 backdrop-blur"
        canClear={canClear}
        onClear={() => {
          setMessages([]);
          store.clear();
        }}
        subtitle="AI Elements UI • AI SDK streaming • server-side tools"
        title="Agent Starter"
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <Conversation className="h-full rounded-lg border">
          <ConversationContent className="gap-6 p-6">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10">
              <ConversationEmptyState
                title="Start a conversation"
                description="Try a prompt below or type your own."
              />

              <div className="w-full max-w-2xl">
                <Suggestions>
                  {SUGGESTIONS.map((text) => (
                    <Suggestion
                      key={text}
                      suggestion={text}
                      onClick={(s) => setInput(s)}
                    />
                  ))}
                </Suggestions>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageParts
                key={message.id}
                isLastMessage={message.id === messages.at(-1)?.id}
                message={message}
                onRetry={message.role === "assistant" ? regenerate : undefined}
                status={status}
              />
            ))
          )}

          {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {error && (
          <div className="mx-auto mt-4 w-full max-w-3xl">
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <PromptInput
          className="mx-auto mt-4 w-full max-w-3xl"
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
            />
          </PromptInputBody>

          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputSelect onValueChange={setModel} value={model}>
                <PromptInputSelectTrigger>
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

              <PromptInputButton
                onClick={() => regenerate()}
                type="button"
                variant="ghost"
              >
                <RefreshCcwIcon className="size-4" />
                <span>Retry</span>
              </PromptInputButton>
            </PromptInputTools>

            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}


