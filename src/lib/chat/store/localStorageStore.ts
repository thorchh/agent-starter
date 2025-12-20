import type { UIMessage } from "ai";

import type { ChatStore, ChatThreadState } from "./types";

/**
 * localStorage-backed store.
 *
 * - Single-thread: easiest UX for a starter template.
 * - Versioned key: allows us to migrate later without breaking existing users.
 *
 * DB upgrade path:
 * - Implement `dbStore.ts` with the same `ChatStore` interface.
 * - Swap the store implementation in the UI (dependency injection).
 */

const STORAGE_KEY = "agentic-starter.chat.v1";

type StoredPayloadV1 = {
  thread: ChatThreadState["thread"];
  messages: UIMessage[];
};

function nowIso() {
  return new Date().toISOString();
}

export function createLocalStorageStore(): ChatStore {
  return {
    async loadLastThread() {
      if (typeof window === "undefined") return null;

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw) as StoredPayloadV1;
        if (!parsed?.thread || !Array.isArray(parsed?.messages)) return null;
        return { thread: parsed.thread, messages: parsed.messages };
      } catch {
        return null;
      }
    },

    async saveThread(state) {
      if (typeof window === "undefined") return;

      const payload: StoredPayloadV1 = {
        thread: {
          ...state.thread,
          updatedAt: nowIso(),
        },
        messages: state.messages,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },

    async clear() {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEY);
    },
  };
}
