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

/**
 * localStorage is small (~5-10MB depending on browser) and is not suitable for storing
 * raw attachment bytes (e.g. PDFs as base64 data URLs).
 *
 * We therefore sanitize messages before persisting:
 * - Replace large file URLs with a lightweight placeholder URL.
 * - Optionally truncate other huge strings/objects to prevent quota errors.
 *
 * This keeps the starter template stable while preserving a clear DB upgrade path later.
 */
const OMITTED_FILE_URL = "local-storage://omitted";

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function sanitizeMessagesForStorage(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    const parts = m.parts.map((p) => {
      // File parts are the #1 cause of localStorage quota issues (PDF/image data URLs).
      if (p.type === "file") {
        const url = typeof p.url === "string" ? p.url : "";
        const isProbablyHuge = url.length > 512 || url.startsWith("data:");
        if (!isProbablyHuge) return p;

        return {
          ...p,
          url: OMITTED_FILE_URL,
        };
      }

      // Tool parts can also get large (e.g. long HTML/page extracts). If any field
      // contains a huge string, replace it with a short placeholder.
      if (typeof (p as { type?: unknown }).type === "string") {
        const type = (p as { type: string }).type;
        const isToolLike = type === "dynamic-tool" || type.startsWith("tool-");
        if (isToolLike) {
          const next = { ...(p as Record<string, unknown>) };
          for (const key of ["input", "output", "errorText"]) {
            const v = next[key];
            const s = typeof v === "string" ? v : safeJsonStringify(v);
            if (s && s.length > 50_000) {
              next[key] = "[omitted for localStorage]";
            }
          }
          return next as typeof p;
        }
      }

      return p;
    });

    return { ...m, parts };
  });
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
        messages: sanitizeMessagesForStorage(state.messages),
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        // QuotaExceededError is common when users attach PDFs/images.
        // We never want persistence to crash the app.
        console.warn("[chat-store] Failed to persist to localStorage:", err);

        // Last resort: drop file parts entirely and keep only the most recent messages.
        try {
          const messagesNoFiles = state.messages
            .slice(-30)
            .map((m) => ({ ...m, parts: m.parts.filter((p) => p.type !== "file") }));

          const fallback: StoredPayloadV1 = {
            thread: {
              ...state.thread,
              updatedAt: nowIso(),
            },
            messages: sanitizeMessagesForStorage(messagesNoFiles),
          };

          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        } catch (err2) {
          console.warn(
            "[chat-store] Fallback persistence also failed; clearing stored thread:",
            err2
          );
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            // ignore
          }
        }
      }
    },

    async clear() {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEY);
    },
  };
}
