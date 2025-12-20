## `src/lib/chat/store` (persistence layer)

This folder defines a minimal persistence interface for chat threads.

Today, the template uses a localStorage implementation:
- `localStorageStore.ts`

Later, you can add DB persistence without rewriting the UI:
- Implement `dbStore.ts`
- Swap the store constructor used by `src/app/chat/page.tsx`

### Why an interface?

Agent apps almost always outgrow “in-memory chat”:
- multiple threads
- user accounts / auth
- sharing / collaboration
- audit logs

The `ChatStore` interface is the seam that lets you grow into those features.

## `src/lib/chat/store` (persistence layer)

This folder defines a minimal persistence interface for chat threads.

Today, the template uses a localStorage implementation:
- `localStorageStore.ts`

Later, you can add DB persistence without rewriting the UI:
- Implement `dbStore.ts`
- Swap the store constructor used by `src/app/chat/page.tsx`

### Why an interface?

Agent apps almost always outgrow “in-memory chat”:
- multiple threads
- user accounts / auth
- sharing / collaboration
- audit logs

The `ChatStore` interface is the seam that lets you grow into those features.


