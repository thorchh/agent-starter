## `src/lib/chat/store` (persistence layer)

This folder defines a minimal persistence interface for chat threads.

Today, the template uses the AI SDK UI “Chatbot Message Persistence” pattern:
- The app routes with chat IDs (`/chat/[id]`)
- Messages are persisted on the server (see `src/lib/chat/server/fileChatStore.ts`)

This `store/` folder remains as a reference seam if you prefer a client-side or DB-backed store.

Later, you can add DB persistence without rewriting the UI:
- Implement `dbStore.ts`
- Swap the server store used by the API route (`src/app/api/chat/route.ts`)

### Why an interface?

Agent apps almost always outgrow “in-memory chat”:
- multiple threads
- user accounts / auth
- sharing / collaboration
- audit logs

The `ChatStore` interface is the seam that lets you grow into those features.
