import { loadChat } from "@/lib/chat/server/fileChatStore";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatIdPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const initialMessages = await loadChat(id);

  return <ChatClient id={id} initialMessages={initialMessages} />;
}



