import { redirect } from "next/navigation";

import { createChat } from "@/lib/chat/server/fileChatStore";

export default async function ChatPage() {
  const id = await createChat();
  redirect(`/chat/${id}`);
}