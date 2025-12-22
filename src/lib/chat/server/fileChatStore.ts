import "server-only";

import { generateId, type UIMessage } from "ai";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * File-based chat store (docs-aligned).
 *
 * This mirrors the AI SDK "Chatbot Message Persistence" guide:
 * - chats are stored in `.chats/{id}.json`
 * - messages are stored as UIMessage[] JSON
 *
 * Caveat: the filesystem is ephemeral on most serverless platforms (including Vercel).
 * This is intended for local dev + as a reference implementation. Swap it for a DB later.
 */

const CHAT_DIR = path.join(process.cwd(), ".chats");

function ensureChatDir() {
  if (!existsSync(CHAT_DIR)) {
    mkdirSync(CHAT_DIR, { recursive: true });
  }
}

function getChatFile(id: string): string {
  ensureChatDir();
  return path.join(CHAT_DIR, `${id}.json`);
}

/**
 * Attachments in UIMessage parts can include large data URLs (PDF/images) and should not
 * be persisted as raw bytes in JSON. We persist metadata only and provide a clear
 * extension point for real blob storage later.
 */
export const OMITTED_ATTACHMENT_URL = "omitted://attachment";

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function sanitizeMessagesForPersistence(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    const parts = m.parts.map((p) => {
      // Metadata-only attachments. (Blob storage can be added later and replace this URL.)
      if (p.type === "file") {
        return {
          ...p,
          // Always omit the actual URL/bytes from persisted storage:
          url: OMITTED_ATTACHMENT_URL,
        };
      }

      // Tool outputs can be very large (page extracts, etc.). Keep persistence robust.
      if (typeof (p as { type?: unknown }).type === "string") {
        const type = (p as { type: string }).type;
        const isToolLike = type === "dynamic-tool" || type.startsWith("tool-");
        if (isToolLike) {
          const next = { ...(p as Record<string, unknown>) };
          for (const key of ["input", "output", "errorText"]) {
            const v = next[key];
            const s = typeof v === "string" ? v : safeJsonStringify(v);
            if (s && s.length > 200_000) {
              next[key] = "[omitted for persistence]";
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

export async function createChat(): Promise<string> {
  const id = generateId();
  await writeFile(getChatFile(id), "[]", "utf8");
  return id;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  try {
    return JSON.parse(await readFile(getChatFile(id), "utf8")) as UIMessage[];
  } catch {
    // If it doesn't exist / can't be parsed, start fresh.
    return [];
  }
}

export async function saveChat(opts: { id: string; messages: UIMessage[] }) {
  const sanitized = sanitizeMessagesForPersistence(opts.messages);
  await writeFile(getChatFile(opts.id), JSON.stringify(sanitized, null, 2), "utf8");
}


