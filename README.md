## Agent Workflow Starter (AI Elements + AI SDK)

Polished starter template for building **agentic workflows** with:

- Next.js (App Router) + TypeScript + pnpm
- Tailwind + shadcn/ui + **AI Elements**
- **Vercel AI SDK** streaming chat + multi-step tool calling
- Multi-provider support (OpenAI, Groq, AI Gateway)
- Chat persistence (AI SDK UI) using a file-based store in local dev

Docs references:

- `https://ai-sdk.dev/elements/examples/chatbot`
- `https://ai-sdk.dev/elements`
- `https://ai-sdk.dev/docs/introduction`
- `https://vercel.com/academy/ai-sdk/ai-elements#the-magic-moment-`

### Features

This starter includes a rich set of production-ready features:

**Chat Experience:**
- **Streaming responses** - Real-time AI responses using Vercel AI SDK
- **Chat history sidebar** - Organized by time (Today, Yesterday, Last 7 days, etc.)
- **Multi-step tool calling** - Supports iterative tool execution
- **Search with citations** - Toggle web search with inline citation markers `[1]`, `[2]`
- **Chain-of-thought visualization** - Collapsible thought process display
- **Reasoning summaries** - For o-series models (o4-mini, o1, etc.)
- **File attachments** - Drag-and-drop support (metadata-only in starter)
- **Draft mode** - Chats aren't persisted until first message
- **Debug mode** - Verbose tool input/output display

**Model Support:**
- **OpenAI** - GPT-5, GPT-4o, GPT-4o-mini, o4-mini
- **Groq** - DeepSeek R1 distilled (70B)
- **AI Gateway** - Route via Vercel AI Gateway
- **Runtime switching** - Change models mid-conversation

**UI/UX:**
- **Theme toggle** - Light/dark mode support
- **Mobile responsive** - Works on all screen sizes
- **Keyboard shortcuts** - Cmd+K for new chat, Cmd+Enter to send
- **Token usage display** - Input/output token tracking
- **Model selector** - Dropdown in chat UI

**Developer Experience:**
- **TypeScript strict mode** - Full type safety
- **ESLint configured** - Next.js + AI Elements rules
- **Hot reload** - Fast development iteration
- **Extensible tools** - Simple pattern for adding new tools
- **Clean architecture** - Clear separation of concerns

### Quickstart

1. Install dependencies

```bash
pnpm install
```

2. Set up environment variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key
OPENAI_API_KEY=sk-...
```

3. Run dev server

```bash
pnpm dev
```

Open:

- `http://localhost:3000/` - Landing page
- `http://localhost:3000/chat` - Chat interface

### Environment Variables

See `.env.example` for all available configuration options.

**Required:**

- `OPENAI_API_KEY` - Your OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

**Optional Providers:**

- `GROQ_API_KEY` - For DeepSeek R1 model ([Groq Console](https://console.groq.com))
- `AI_GATEWAY_API_KEY` - For AI Gateway models ([Vercel AI Gateway](https://vercel.com/docs/ai-gateway))

**Optional Configuration:**

- `AI_MODEL` - Default model (default: `openai/gpt-5`)
  - Options: `openai/gpt-5`, `openai/gpt-4o`, `openai/gpt-4o-mini`, `openai/o4-mini`, `groq/deepseek-r1-distill-llama-70b`

**Optional Reasoning Features (o-series models):**

- `ENABLE_REASONING` - Enable reasoning summaries (default: `false`)
- `OPENAI_REASONING_SUMMARY` - Detail level (`auto` | `detailed`)
- `OPENAI_REASONING_EFFORT` - Effort level (`minimal` | `low` | `medium` | `high`)

See the [OpenAI reasoning docs](https://ai-sdk.dev/providers/ai-sdk-providers/openai) for more details.

### Multi-Provider Setup

#### OpenAI (Default)

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

Models available: `openai/gpt-5`, `openai/gpt-4o`, `openai/gpt-4o-mini`, `openai/o4-mini`

#### Groq

```bash
# .env.local
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk-...
```

Models available: `groq/deepseek-r1-distill-llama-70b`

#### AI Gateway

```bash
# .env.local
OPENAI_API_KEY=sk-...
AI_GATEWAY_API_KEY=vck-...
```

Models available: Any model prefixed with `gateway/`

See `src/lib/ai/provider.ts` for provider routing logic.

### Project structure

#### Chat UI

- `src/app/page.tsx`: landing page with features overview
- `src/app/chat/page.tsx`: creates a new chat and redirects to `/chat/[id]` (docs pattern)
- `src/app/chat/[id]/page.tsx`: server-loads persisted messages and renders the chat client
- `src/components/chat/ChatClient.tsx`: main chat screen (AI Elements `Conversation` + `PromptInput` + `MessageParts`)
- `src/components/chat/MessageParts.tsx`: the single place where `message.parts` are rendered (text, attachments, tools, reasoning, sources)
- `src/components/chat/ChatHeader.tsx`: minimal header (clear chat + title)
- `src/components/chat/ChatSidebar.tsx`: chat history sidebar with search and time-based grouping
- `src/components/ui/theme-toggle.tsx`: light/dark mode toggle

#### API

- `src/app/api/chat/route.ts`: streaming route handler using `streamText(...).toUIMessageStreamResponse()`
- `src/app/api/chats/route.ts`: list all chats (GET)
- `src/app/api/chats/[id]/route.ts`: delete specific chat (DELETE)

#### AI layer

- `src/lib/ai/models.ts`: model allowlist + normalization + defaults
- `src/lib/ai/provider.ts`: multi-provider routing (OpenAI/Groq/Gateway)
- `src/lib/ai/system-prompt.ts`: system prompt (short, stable, tool-aware, citation-aware)
- `src/lib/ai/tools/*`: server-side tool registry

#### Persistence

- `src/lib/chat/server/fileChatStore.ts`: docs-style file store (`.chats/{id}.json`) for local dev
- `.chats/`: ignored from git; created on demand

**Attachments note:**

This starter **persists attachment metadata only** (filename/mediaType/size). File bytes/URLs are not stored; the UI will ask you to re-upload after refresh. In production, swap in a blob store (S3/R2/Vercel Blob) and persist blob URLs/keys instead.

### API Endpoints

**POST `/api/chat`**
- Streaming chat endpoint
- Accepts: `{ id?, messages, modelId?, useSearch?, debug? }`
- Returns: Streaming `UIMessage` parts
- Features: Multi-step tools, reasoning extraction, persistence

**GET `/api/chats`**
- List all chats
- Returns: `{ id, title, updatedAt }[]`
- Sorted by most recent first

**DELETE `/api/chats/[id]`**
- Delete specific chat
- Returns: Success/error status

### How tool calling works

The server uses AI SDK `streamText` with a tools object (`src/lib/ai/tools/index.ts`). Tool calls/results are streamed to the client as **typed parts** on assistant messages, and rendered via the AI Elements `Tool` components in `MessageParts`.

**Web Search:**
This starter uses OpenAI's built-in `web_search` tool when the search toggle is enabled in the UI. For custom search integration (Tavily, SerpAPI, Exa), see `src/lib/ai/tools/examples/searchCustomAPI.ts`.

**Built-in Tools:**
- `getTime` - Returns current server time
- `getWeather` - Mock weather data (replace with real API)
- `summarizeAttachments` - Summarizes uploaded files

### Add a new tool

1. Create a new file in `src/lib/ai/tools/`, e.g. `myTool.ts` and export a `tool({ description, parameters, execute })`.
2. Export it from `src/lib/ai/tools/index.ts`.
3. Restart the dev server.

See `src/lib/ai/tools/examples/` for templates showing database queries, API calls, custom search, and more.

### DB persistence upgrade path

This starter follows the AI SDK UI persistence flow (server-side storage + chat IDs). The file store is intentionally simple for local dev; on Vercel you should replace it with a real database + blob storage for attachments.

See `DEPLOYMENT.md` for step-by-step instructions on:
- Vercel Postgres integration
- Supabase integration
- Blob storage setup (Vercel Blob, S3, R2)

### Troubleshooting

#### "Missing API key" error
Ensure you've created `.env.local` with your `OPENAI_API_KEY`:
```bash
cp .env.example .env.local
# Edit .env.local and add your API key
```

#### "Model not allowed" error
The model ID must be in the allowlist in `src/lib/ai/models.ts`. Check that your `AI_MODEL` environment variable or UI selection matches an allowed model.

#### Attachments not persisting after refresh
This is expected in the starter. Files are stored as metadata only. For production, integrate blob storage (S3, R2, Vercel Blob). See `DEPLOYMENT.md` for setup instructions.

#### Slow responses
- **o-series models** (o4-mini, o1) are slower but more capable
- For faster development, use `gpt-4o-mini`
- Check your network connection and OpenAI API status

#### Chat history not showing
- Ensure the `.chats/` directory exists and is writable
- Check browser console for errors
- Verify `/api/chats` endpoint is accessible

#### Theme toggle not working
- Clear browser cache and reload
- Check that `next-themes` is installed: `pnpm install`
- Verify ThemeProvider in `src/app/layout.tsx`

### Additional Documentation

- `ARCHITECTURE.md` - System design and data flow
- `DEPLOYMENT.md` - Production deployment guide
- `CONTRIBUTING.md` - Development guidelines
- `src/lib/ai/tools/examples/README.md` - Tool development examples

### Next Steps

**For Development:**
1. Customize the system prompt in `src/lib/ai/system-prompt.ts`
2. Add your own tools in `src/lib/ai/tools/`
3. Update branding in `src/app/page.tsx` and `src/app/layout.tsx`
4. Configure additional models in `src/lib/ai/models.ts`

**For Production:**
1. Set up database persistence (see `DEPLOYMENT.md`)
2. Configure blob storage for attachments
3. Add authentication (NextAuth, Clerk, etc.)
4. Add rate limiting and usage monitoring
5. Deploy to Vercel (or other Next.js host)

### License

This is a starter template. Use it however you like.
