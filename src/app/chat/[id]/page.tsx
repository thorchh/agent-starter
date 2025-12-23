import { loadChat } from "@/lib/chat/server/fileChatStore";
import { ChatClient } from "@/components/chat/ChatClient";
import type { UIMessage } from "ai";

export default async function ChatIdPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  let initialMessages: UIMessage[] = [];
  try {
    initialMessages = await loadChat(id);
  } catch (err) {
    // Graceful fallback: if the stored chat can't be loaded, start with empty history.
    console.warn("[chat] failed to load chat, starting fresh:", err);
    initialMessages = [];
  }

  return <ChatClient id={id} initialMessages={initialMessages} />;
}




