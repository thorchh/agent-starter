import "server-only";

import { generateId, type UIMessage } from "ai";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { OMITTED_ATTACHMENT_URL } from "@/lib/chat/constants";
import {
  deleteAttachments,
  isStoredAttachmentUrl,
  loadAttachment,
  pathToStoredUrl,
  saveAttachment,
  storedUrlToPath,
} from "./attachmentStore";

/**
 * File-based chat store with integrated attachment persistence.
 *
 * OVERVIEW:
 * This implements the AI SDK "Chatbot Message Persistence" pattern with
 * added support for file attachments:
 * - Chat messages stored in `.chats/{id}.json` (lightweight JSON)
 * - File attachments stored in `.chats/attachments/{id}/` (binary files)
 * - Uses stored:// references in JSON to link to files
 *
 * DATA FLOW:
 * 1. SAVE: Extract file data from data URLs → save to disk → store references
 * 2. LOAD: Read chat JSON → detect stored:// references → load files → convert to data URLs
 * 3. DELETE: Remove chat JSON + associated attachment files
 *
 * ⚠️ IMPORTANT - NOT PRODUCTION READY:
 * The filesystem is ephemeral on serverless platforms (Vercel, Netlify, AWS Lambda).
 * This works great for local dev but MUST be upgraded to:
 * - Database (PostgreSQL, MongoDB, etc.) for chat messages
 * - Blob storage (S3, R2, Vercel Blob) for file attachments
 *
 * See ATTACHMENT_STORAGE.md for detailed upgrade instructions.
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

export { OMITTED_ATTACHMENT_URL };

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string; // ISO
};

function safeJsonStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

/**
 * Sanitize messages for persistence by extracting and storing file attachments.
 *
 * CURRENT IMPLEMENTATION:
 * - Detects file parts with data URLs
 * - Saves file data to .chats/attachments/{chatId}/
 * - Replaces data URL with stored:// reference
 * - Keeps already-stored files unchanged
 * - Keeps omitted files as omitted
 *
 * UPGRADE PATH TO BLOB STORAGE:
 * The logic stays mostly the same, just update the saveAttachment() call
 * to upload to S3 instead of local disk. The stored:// references work
 * the same way - they just point to S3 keys instead of local paths.
 */
function sanitizeMessagesForPersistence(chatId: string, messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    const parts = m.parts.map((p) => {
      // Save file attachments to disk and replace URL with stored:// reference
      if (p.type === "file") {
        // If already stored, keep the reference
        if (typeof p.url === "string" && isStoredAttachmentUrl(p.url)) {
          return p;
        }

        // If omitted, keep it omitted
        if (
          typeof p.url === "string" &&
          (p.url.startsWith("local-storage://omitted") || p.url === OMITTED_ATTACHMENT_URL)
        ) {
          return {
            ...p,
            url: OMITTED_ATTACHMENT_URL,
          };
        }

        // Save new attachment to disk
        if (typeof p.url === "string" && p.url.startsWith("data:")) {
          const stored = saveAttachment(chatId, p.url, p.filename, p.mediaType);
          if (stored) {
            return {
              ...p,
              url: pathToStoredUrl(stored.path),
            };
          }
        }

        // Fallback: omit if we couldn't save it
        return {
          ...p,
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

/**
 * Load a chat from disk and restore file attachments.
 *
 * CURRENT IMPLEMENTATION:
 * - Reads chat JSON from .chats/{id}.json
 * - Detects stored:// references in file parts
 * - Loads file data from .chats/attachments/{id}/
 * - Converts back to data URLs for client
 * - Marks files as omitted if they're missing from disk
 *
 * UPGRADE PATH TO BLOB STORAGE:
 * Replace loadAttachment() calls with S3 signed URLs:
 * ```typescript
 * const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
 *   Bucket: process.env.S3_BUCKET,
 *   Key: relativePath,
 *   Expires: 3600,
 * }));
 * return { ...p, url: signedUrl };
 * ```
 * This is MUCH more efficient than converting to data URLs!
 */
export async function loadChat(id: string): Promise<UIMessage[]> {
  try {
    const messages = JSON.parse(await readFile(getChatFile(id), "utf8")) as UIMessage[];

    // Restore attachments from disk
    return messages.map((m) => {
      const parts = m.parts.map((p) => {
        if (p.type === "file" && typeof p.url === "string" && isStoredAttachmentUrl(p.url)) {
          const relativePath = storedUrlToPath(p.url);
          const dataUrl = loadAttachment(relativePath);

          if (dataUrl) {
            return {
              ...p,
              url: dataUrl,
            };
          }

          // If file doesn't exist on disk anymore, mark as omitted
          return {
            ...p,
            url: OMITTED_ATTACHMENT_URL,
          };
        }

        return p;
      });

      return { ...m, parts };
    });
  } catch {
    // If it doesn't exist / can't be parsed, start fresh.
    return [];
  }
}

export async function saveChat(opts: { id: string; messages: UIMessage[] }) {
  const sanitized = sanitizeMessagesForPersistence(opts.id, opts.messages);
  await writeFile(getChatFile(opts.id), JSON.stringify(sanitized, null, 2), "utf8");
}

function titleFromMessages(messages: UIMessage[], id: string): string {
  for (const m of messages) {
    if (m.role !== "user") continue;
    for (const p of m.parts) {
      if (p.type === "text") {
        const t = p.text.trim().replace(/\s+/g, " ");
        if (t.length) return t.length > 60 ? `${t.slice(0, 60)}…` : t;
      }
      if (p.type === "file") {
        const name = (p.filename ?? "").trim();
        if (name) return `Attachment: ${name}`;
        return "Attachment";
      }
    }
  }
  // Avoid showing IDs in the UI; keep this friendly.
  return "New chat";
}

export async function listChats(): Promise<ChatSummary[]> {
  ensureChatDir();
  const entries = await readdir(CHAT_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name);

  const summaries = await Promise.all(
    files.map(async (filename) => {
      const id = filename.replace(/\.json$/, "");
      const filePath = path.join(CHAT_DIR, filename);

      const [raw, fileStat] = await Promise.all([
        readFile(filePath, "utf8").catch(() => "[]"),
        stat(filePath).catch(() => null),
      ]);

      let messages: UIMessage[] = [];
      try {
        messages = JSON.parse(raw) as UIMessage[];
      } catch {
        messages = [];
      }

      // Don't surface empty chats in the UI. These are created when visiting /chat,
      // but we only want them to appear after the user has actually sent something.
      if (messages.length === 0) return null;

      const updatedAt = fileStat
        ? fileStat.mtime.toISOString()
        : new Date(0).toISOString();

      return {
        id,
        title: titleFromMessages(messages, id),
        updatedAt,
      } satisfies ChatSummary;
    })
  );

  return (summaries.filter(Boolean) as ChatSummary[]).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

/**
 * Delete a chat and all associated attachments.
 *
 * CURRENT IMPLEMENTATION:
 * - Deletes .chats/{id}.json
 * - Deletes .chats/attachments/{id}/ directory and all files
 *
 * UPGRADE PATH TO BLOB STORAGE:
 * The deleteAttachments() call will be updated to delete from S3.
 * The chat JSON deletion might move to a database DELETE query.
 */
export async function deleteChat(id: string): Promise<void> {
  // Delete chat file
  await unlink(getChatFile(id));

  // Delete associated attachments
  deleteAttachments(id);
}


