## Agent Workflow Starter (AI Elements + AI SDK)

Polished starter template for building **agentic workflows** with:

- Next.js (App Router) + TypeScript + pnpm
- Tailwind + shadcn/ui + **AI Elements**
- **Vercel AI SDK** streaming chat + multi-step tool calling
- OpenAI provider by default (`@ai-sdk/openai`)
- Doc-aligned chat persistence (AI SDK UI) using a file-based store in local dev

Docs references:

- `https://ai-sdk.dev/elements/examples/chatbot`
- `https://ai-sdk.dev/elements`
- `https://ai-sdk.dev/docs/introduction`
- `https://vercel.com/academy/ai-sdk/ai-elements#the-magic-moment-`

### Quickstart

1. Install deps

```bash
pnpm install
```

2. Create `.env.local`

```bash
OPENAI_API_KEY=...
GROQ_API_KEY=...
# Optional (only needed if you select a `gateway/...` model in the UI):
AI_GATEWAY_API_KEY=...
# Optional: OpenAI "thinking output" (reasoning summaries) for o-series models.
# See: https://ai-sdk.dev/providers/ai-sdk-providers/openai
# OPENAI_REASONING_SUMMARY=auto        # 'auto' | 'detailed'
# OPENAI_REASONING_EFFORT=high         # 'minimal' | 'low' | 'medium' | 'high'
AI_MODEL=openai/gpt-5
```

3. Run dev server

```bash
pnpm dev
```

Open:

- `http://localhost:3000/` (landing)
- `http://localhost:3000/chat` (chat UI)

### Project structure

#### Chat UI

- `src/app/chat/page.tsx`: creates a new chat and redirects to `/chat/[id]` (docs pattern)
- `src/app/chat/[id]/page.tsx`: server-loads persisted messages and renders the chat client
- `src/components/chat/ChatClient.tsx`: main chat screen (AI Elements `Conversation` + `PromptInput` + `MessageParts`)
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

- `src/lib/chat/server/fileChatStore.ts`: docs-style file store (`.chats/{id}.json`) for local dev
- `.chats/`: ignored from git; created on demand

Attachments note:
- This starter **persists attachment metadata only** (filename/mediaType/size). File bytes/URLs are not stored; the UI will ask you to re-upload after refresh. In production, swap in a blob store (S3/R2/Vercel Blob) and persist blob URLs/keys instead.

### How tool calling works

The server uses AI SDK `streamText` with a tools object (`src/lib/ai/tools/index.ts`). Tool calls/results are streamed to the client as **typed parts** on assistant messages, and rendered via the AI Elements `Tool` components in `MessageParts`.

### Add a new tool

1. Create a new file in `src/lib/ai/tools/`, e.g. `myTool.ts` and export a `tool({ description, parameters, execute })`.
2. Export it from `src/lib/ai/tools/index.ts`.
3. Restart the dev server.

### DB persistence upgrade path

This starter follows the AI SDK UI persistence flow (server-side storage + chat IDs). The file store is intentionally simple for local dev; on Vercel you should replace it with a real database + blob storage for attachments.
