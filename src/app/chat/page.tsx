import { redirect } from "next/navigation";

import { createChat } from "@/lib/chat/server/fileChatStore";

export default async function ChatPage() {
  // Docs-aligned: always create a new chat and redirect to /chat/[id].
  // Ref: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence
  const id = await createChat();
  redirect(`/chat/${id}`);
}