## `src/lib/chat/store` (persistence layer)

This folder defines the persistence interface for chat threads.

### Current Implementation

The template uses the AI SDK UI "Chatbot Message Persistence" pattern:

- Chat IDs in routes (`/chat/[id]`)
- Server-side persistence via `src/lib/chat/server/fileChatStore.ts`
- File-based storage in `.chats/` directory (local dev only)

**Current Store:**
- `server/fileChatStore.ts` - Active implementation
  - Stores chats as JSON files in `.chats/{id}.json`
  - Works great for local development
  - **Ephemeral on serverless** (Vercel, etc.) - files lost between deployments

**Interface Files:**
- `types.ts` - TypeScript interface for chat storage
- `dbStore.ts` - Placeholder for database implementation
- `localStorageStore.ts` - Placeholder for client-side storage

### Production Upgrade Path

For production deployment, replace `fileChatStore.ts` with a database implementation:

**Option 1: Server-side Database (Recommended)**
```typescript
// src/lib/chat/server/postgresChatStore.ts
import { sql } from '@vercel/postgres';

export async function createChat(): Promise<string> {
  // Postgres implementation
}
// ... implement all methods from types.ts
```

Then update imports in `/api/chat/route.ts`:
```typescript
// Replace:
import { loadChat, saveChat } from "@/lib/chat/server/fileChatStore";
// With:
import { loadChat, saveChat } from "@/lib/chat/server/postgresChatStore";
```

**Option 2: Client-side (LocalStorage/IndexedDB)**
- Use `localStorageStore.ts` as starting point
- Note: Not suitable for multi-user or auth scenarios
- Data stays in browser (not synced across devices)

See `DEPLOYMENT.md` for complete setup instructions including:
- Vercel Postgres integration
- Supabase setup
- Database migrations
- Blob storage for attachments

### Why an interface?

Agent apps almost always outgrow "in-memory chat":

- Multiple chat threads per user
- User accounts and authentication
- Sharing and collaboration
- Audit logs and compliance
- Cross-device synchronization

The `ChatStore` interface provides a clear seam for upgrading storage without rewriting UI components.

### File Store Limitations

**Development (Great):**
- ✅ Zero setup - works immediately
- ✅ Easy to inspect (JSON files)
- ✅ Git-ignored by default
- ✅ Simple to understand

**Production (Not Suitable):**
- ❌ Ephemeral on serverless platforms
- ❌ Not shared across instances
- ❌ No concurrent access control
- ❌ Files lost on deployment
- ❌ No backup/recovery

**Bottom line:** Use file store for local dev, switch to database for production.
