import type { ChatStore } from "./types";

/**
 * Placeholder DB-backed store.
 *
 * This is intentionally NOT implemented in the starter.
 *
 * When you add DB persistence, implement this module and swap the store
 * implementation used by the UI.
 *
 * Common approaches:
 * - Postgres (Vercel Postgres / Neon) + Drizzle/Prisma
 * - KV (for lightweight threads)
 *
 * Suggested minimal schema:
 * - threads(id, title, created_at, updated_at, user_id?)
 * - messages(id, thread_id, role, parts_json, created_at)
 */
export function createDbStore(): ChatStore {
  throw new Error(
    "DB store not implemented. Use createLocalStorageStore() for the starter."
  );
}
