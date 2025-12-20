import type { UIMessage } from "ai";

/**
 * Storage interfaces are intentionally small.
 *
 * Today: localStorage-backed single-thread chat.
 * Tomorrow: DB-backed multi-thread chat with users/auth.
 */

export type ChatThreadId = string;

export type ChatThread = {
  id: ChatThreadId;
  title?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type ChatThreadState = {
  thread: ChatThread;
  messages: UIMessage[];
};

export interface ChatStore {
  /** Load the last-opened thread. */
  loadLastThread(): Promise<ChatThreadState | null>;

  /** Save the given thread state. */
  saveThread(state: ChatThreadState): Promise<void>;

  /** Clear local state (useful for reset). */
  clear(): Promise<void>;
}


