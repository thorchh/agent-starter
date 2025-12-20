## Agent Workflow Starter (AI Elements + AI SDK)

Polished starter template for building **agentic workflows** with:

- Next.js (App Router) + TypeScript + pnpm
- Tailwind + shadcn/ui + **AI Elements**
- **Vercel AI SDK** streaming chat + multi-step tool calling
- OpenAI provider by default (`@ai-sdk/openai`)
- Local conversation persistence (localStorage) with a DB-ready interface

Docs references:
- `https://ai-sdk.dev/elements/examples/chatbot`
- `https://ai-sdk.dev/elements`
- `https://ai-sdk.dev/docs/introduction`
- `https://vercel.com/academy/ai-sdk/ai-elements#the-magic-moment-`

### Quickstart

1) Install deps

```bash
pnpm install
```

2) Create `.env.local`

```bash
OPENAI_API_KEY=...
AI_MODEL=openai/gpt-5
```

3) Run dev server

```bash
pnpm dev
```

Open:
- `http://localhost:3000/` (landing)
- `http://localhost:3000/chat` (chat UI)

### Project structure

#### Chat UI
- `src/app/chat/page.tsx`: main chat screen (AI Elements `Conversation` + `PromptInput` + `MessageParts`)
- `src/components/chat/MessageParts.tsx`: the single place where `message.parts` are rendered (text, attachments, tools, reasoning, sources)
- `src/components/chat/ChatHeader.tsx`: minimal header (clear chat + title)

#### API
- `src/app/api/chat/route.ts`: streaming route handler using `streamText(...).toUIMessageStreamResponse()`

#### AI layer
- `src/lib/ai/models.ts`: model allowlist + normalization + defaults
- `src/lib/ai/provider.ts`: OpenAI provider wiring
- `src/lib/ai/system-prompt.ts`: system prompt (short, stable, tool-aware)
- `src/lib/ai/tools/*`: server-side tool registry

#### Persistence
- `src/lib/chat/store/types.ts`: `ChatStore` interface (DB-upgradable)
- `src/lib/chat/store/localStorageStore.ts`: current implementation
- `src/lib/chat/store/dbStore.ts`: placeholder skeleton for future DB integration

### How tool calling works

The server uses AI SDK `streamText` with a tools object (`src/lib/ai/tools/index.ts`). Tool calls/results are streamed to the client as **typed parts** on assistant messages, and rendered via the AI Elements `Tool` components in `MessageParts`.

### Add a new tool

1) Create a new file in `src/lib/ai/tools/`, e.g. `myTool.ts` and export a `tool({ description, parameters, execute })`.
2) Export it from `src/lib/ai/tools/index.ts`.
3) Restart the dev server.

### DB persistence upgrade path

This starter keeps a `ChatStore` interface so moving from localStorage to a DB is a swap:
- Implement `createDbStore()` in `src/lib/chat/store/dbStore.ts`.
- Switch the store used in `src/app/chat/page.tsx`.
- Add threads/users/auth as needed.
