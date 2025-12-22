# Architecture Overview

This document explains the architecture, design decisions, and data flow of the Agent Workflow Starter.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Directory Structure](#directory-structure)
- [Core Systems](#core-systems)
  - [AI Layer](#ai-layer)
  - [Chat Persistence](#chat-persistence)
  - [UI Components](#ui-components)
  - [API Routes](#api-routes)
- [Data Flow](#data-flow)
- [Key Design Decisions](#key-design-decisions)
- [Extension Points](#extension-points)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Components (Client)                          │   │
│  │  - ChatClient (main interface)                      │   │
│  │  - MessageParts (text, code, reasoning, citations)  │   │
│  │  - ChatSidebar (history)                            │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │ useChat hook (Vercel AI SDK)          │
│                     │ streaming responses                   │
└─────────────────────┼─────────────────────────────────────┘
                      │ HTTP/SSE
┌─────────────────────▼─────────────────────────────────────┐
│                   Next.js Server                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  API Routes                                         │  │
│  │  - POST /api/chat (streaming chat)                  │  │
│  │  - GET /api/chats (list chats)                      │  │
│  │  - DELETE /api/chats/[id] (delete chat)             │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                       │
│  ┌─────────────────▼──────────────┬────────────────────┐  │
│  │  AI Layer                      │  Chat Store        │  │
│  │  - Model routing               │  - Load chat       │  │
│  │  - Tool execution              │  - Save chat       │  │
│  │  - Reasoning extraction        │  - List chats      │  │
│  │  - Citation tracking           │  - Delete chat     │  │
│  └──────────────────┬──────────────┴────────────────────┘  │
│                     │                                       │
└─────────────────────┼───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              External Services                           │
│  - OpenAI API (GPT models)                               │
│  - Groq API (Llama, Mixtral)                             │
│  - AI Gateway (unified endpoint)                         │
│  - Database (Postgres/Supabase - production)             │
│  - Blob Storage (Vercel Blob/S3 - production)            │
└──────────────────────────────────────────────────────────┘
```

## Directory Structure

```
agent/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout (metadata, fonts)
│   │   ├── chat/[id]/page.tsx        # Chat page (dynamic route)
│   │   └── api/                      # API routes
│   │       ├── chat/route.ts         # POST /api/chat (streaming)
│   │       └── chats/                # Chat management
│   │           ├── route.ts          # GET /api/chats (list)
│   │           └── [id]/route.ts     # DELETE /api/chats/[id]
│   │
│   ├── components/                   # React components
│   │   ├── chat/                     # Chat UI
│   │   │   ├── ChatClient.tsx        # Main chat interface
│   │   │   ├── ChatSidebar.tsx       # Chat history sidebar
│   │   │   └── MessageParts.tsx      # Message rendering
│   │   └── ui/                       # shadcn/ui primitives
│   │       └── ...                   # Button, Card, etc.
│   │
│   ├── lib/                          # Core libraries
│   │   ├── ai/                       # AI layer
│   │   │   ├── provider.ts           # Model routing, middleware
│   │   │   ├── models.ts             # Model definitions
│   │   │   ├── tools/                # Tool definitions
│   │   │   │   ├── index.ts          # Tool registry
│   │   │   │   ├── getTime.ts        # Example tool
│   │   │   │   ├── getWeather.ts     # Example tool
│   │   │   │   └── examples/         # Tool templates
│   │   │   └── README.md             # AI layer docs
│   │   │
│   │   ├── chat/                     # Chat persistence
│   │   │   ├── store/                # Store implementations
│   │   │   │   ├── types.ts          # TypeScript interfaces
│   │   │   │   ├── fileChatStore.ts  # File-based (dev)
│   │   │   │   └── README.md         # Store docs
│   │   │   └── utils.ts              # Chat utilities
│   │   │
│   │   └── utils.ts                  # Shared utilities
│   │
│   └── hooks/                        # Custom React hooks
│       └── use-*.ts                  # Theme, mobile, etc.
│
├── .chats/                           # File-based chat storage (dev)
│   └── {id}.json                     # Chat files
│
├── .env.local                        # Environment variables (local)
├── .env.example                      # Template for environment vars
├── README.md                         # Main documentation
├── DEPLOYMENT.md                     # Production deployment guide
├── ARCHITECTURE.md                   # This file
└── CONTRIBUTING.md                   # Contribution guidelines
```

## Core Systems

### AI Layer

**Location:** `src/lib/ai/`

**Purpose:** Manages AI model routing, tool execution, and response processing.

#### Components

1. **Provider (`provider.ts`)**
   - Routes requests to correct AI provider (OpenAI, Groq, Gateway)
   - Applies middleware for reasoning extraction
   - Handles model-specific configurations

   ```typescript
   // Usage in API route
   import { getModel } from '@/lib/ai/provider';

   const model = getModel(modelId);
   ```

2. **Models (`models.ts`)**
   - Defines available models and their capabilities
   - Implements model allowlist for security
   - Maps model IDs to provider clients

   ```typescript
   // Model definition
   {
     id: 'openai/gpt-4o',
     name: 'GPT-4o',
     provider: 'openai',
     supportsReasoning: false,
     supportsTools: true,
   }
   ```

3. **Tools (`tools/`)**
   - Defines server-side functions AI can call
   - Uses Zod for type-safe parameter validation
   - Examples: getTime, getWeather, summarizeAttachments

   ```typescript
   // Tool definition
   export const myTool = tool({
     description: 'What this tool does',
     parameters: z.object({ /* ... */ }),
     execute: async (params) => { /* ... */ },
   });
   ```

#### Key Features

- **Multi-Provider Support**: Seamlessly route between OpenAI, Groq, and Gateway
- **Reasoning Extraction**: Automatically extract and format reasoning from o-series models
- **Tool Calling**: Execute server-side functions with type safety
- **Citation Tracking**: Track sources for web search results

### Chat Persistence

**Location:** `src/lib/chat/store/`

**Purpose:** Manages chat history loading, saving, and listing.

#### Interface (`types.ts`)

```typescript
interface ChatStore {
  createChat(): Promise<string>;
  loadChat(id: string): Promise<CoreMessage[] | null>;
  saveChat(id: string, messages: CoreMessage[]): Promise<void>;
  deleteChat(id: string): Promise<void>;
  listChats(): Promise<Array<{ id: string; title: string; updatedAt: Date }>>;
}
```

#### Implementations

1. **File Store (`fileChatStore.ts`)** - Development
   - Stores chats as JSON files in `.chats/` directory
   - Simple, no external dependencies
   - **Ephemeral on serverless** (files lost between deployments)

2. **Database Store (production)** - See DEPLOYMENT.md
   - Postgres/Supabase for persistence
   - Connection pooling for serverless
   - Full ACID compliance

#### Draft Mode Pattern

Chats are created as "drafts" (in-memory) until the first message is sent:

```typescript
// User navigates to /chat/new
const [chatId, setChatId] = useState<string | null>(null);

// First message triggers chat creation
if (!chatId) {
  const newId = await createChat();
  setChatId(newId);
  router.push(`/chat/${newId}`);
}
```

This prevents empty chats from cluttering the sidebar.

### UI Components

**Location:** `src/components/chat/`

**Purpose:** Render chat interface with streaming support.

#### Component Hierarchy

```
ChatClient (root)
├── ChatSidebar
│   ├── Logo/Header
│   ├── New Chat Button
│   └── Chat List (grouped by time)
│       └── ChatHistoryItem
│
└── Chat Area
    ├── Header (model selector, toggles)
    ├── Message List
    │   └── MessageParts
    │       ├── TextPart
    │       ├── CodePart
    │       ├── ReasoningPart
    │       ├── ToolCallPart
    │       ├── ToolResultPart
    │       └── CitationPart
    └── Input Area
        ├── Textarea
        ├── Attachment Button
        └── Send Button
```

#### Key Patterns

**1. Server/Client Separation**

```typescript
// ChatClient.tsx (client component)
'use client';

export function ChatClient({ initialMessages, chatId }: Props) {
  // React hooks, event handlers, streaming
}
```

```typescript
// page.tsx (server component)
export default async function ChatPage({ params }) {
  const messages = await loadChat(params.id); // Server-side
  return <ChatClient initialMessages={messages} />;
}
```

**2. Streaming with useChat Hook**

```typescript
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  id: chatId,
  initialMessages,
  body: { modelId, enableSearch, debugMode },
  streamProtocol: 'data', // Server-Sent Events
});
```

**3. Message Parts Rendering**

Messages contain typed parts (text, code, reasoning, tool calls):

```typescript
{
  role: 'assistant',
  content: [
    { type: 'text', text: 'Here is the weather:' },
    { type: 'tool-call', toolName: 'getWeather', args: {...} },
    { type: 'tool-result', result: {...} },
  ]
}
```

Each part has a dedicated renderer in `MessageParts.tsx`.

### API Routes

**Location:** `src/app/api/`

#### POST /api/chat

**Purpose:** Stream AI responses with tool calling support.

**Flow:**

1. Load existing chat messages from store
2. Append new user message
3. Initialize AI model with tools
4. Stream response using `streamText()`
5. Save updated chat to store
6. Return SSE stream to client

```typescript
export async function POST(req: Request) {
  const { messages, modelId, chatId } = await req.json();

  // Load existing chat
  const existingMessages = await loadChat(chatId);

  // Stream AI response
  const result = streamText({
    model: getModel(modelId),
    messages: [...existingMessages, ...messages],
    tools,
  });

  // Save chat after streaming
  result.onFinish(async ({ messages }) => {
    await saveChat(chatId, messages);
  });

  return result.toUIMessageStreamResponse();
}
```

#### GET /api/chats

**Purpose:** List all chats for sidebar.

```typescript
export async function GET() {
  const chats = await listChats();
  return Response.json(chats);
}
```

#### DELETE /api/chats/[id]

**Purpose:** Delete a chat.

```typescript
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await deleteChat(params.id);
  return Response.json({ success: true });
}
```

## Data Flow

### Message Sending Flow

```
1. User types message and clicks Send
   │
   ├─> ChatClient: handleSubmit()
   │
   ├─> useChat hook: Append message to local state
   │
   ├─> POST /api/chat
   │   │
   │   ├─> Load existing messages from store
   │   │
   │   ├─> streamText({ model, messages, tools })
   │   │   │
   │   │   ├─> AI model processes request
   │   │   │   │
   │   │   │   ├─> If tool call needed:
   │   │   │   │   ├─> Execute tool function (server-side)
   │   │   │   │   └─> Include result in next prompt
   │   │   │   │
   │   │   │   └─> Generate text response
   │   │   │
   │   │   └─> Stream response chunks via SSE
   │   │
   │   └─> onFinish: Save chat to store
   │
   └─> Client receives streamed chunks
       │
       └─> useChat updates messages state reactively
           │
           └─> UI re-renders with new message parts
```

### Tool Calling Flow

```
1. AI decides to call a tool (e.g., getWeather)
   │
   ├─> Sends tool-call message part:
   │   { type: 'tool-call', toolName: 'getWeather', args: { city: 'SF' } }
   │
   ├─> Server executes tool:
   │   const result = await getWeather.execute({ city: 'SF' });
   │
   ├─> Server sends tool-result part:
   │   { type: 'tool-result', result: { temp: 72, ... } }
   │
   ├─> AI processes result and generates text response:
   │   { type: 'text', text: 'The weather in SF is 72°F...' }
   │
   └─> Client renders all parts in sequence
```

### Chat Loading Flow

```
1. User navigates to /chat/{id}
   │
   ├─> page.tsx (Server Component)
   │   │
   │   ├─> const messages = await loadChat(id)
   │   │   │
   │   │   └─> fileChatStore.ts reads .chats/{id}.json
   │   │
   │   └─> return <ChatClient initialMessages={messages} />
   │
   └─> ChatClient (Client Component)
       │
       └─> useChat({ initialMessages, ... })
           │
           └─> Renders messages immediately (no loading state needed)
```

## Key Design Decisions

### 1. Server-Side Tool Execution

**Decision:** Tools execute on the server, not in the browser.

**Rationale:**
- Security: API keys and credentials stay server-side
- Performance: Database queries and API calls are faster from server
- Simplicity: No CORS or client-side API key management

**Implementation:**
```typescript
// tools/ run on server during streamText()
export const getWeather = tool({
  execute: async ({ city }) => {
    // API key is process.env.WEATHER_API_KEY (server-only)
    const response = await fetch(weatherAPI);
    return response.json();
  },
});
```

### 2. File-Based Development Storage

**Decision:** Use file-based storage (`.chats/`) for development.

**Rationale:**
- Zero setup: No database required for local development
- Easy debugging: Chat files are readable JSON
- Version control friendly: Can commit example chats

**Trade-offs:**
- Not suitable for production (ephemeral on serverless)
- No concurrent access handling
- Manual file cleanup needed

**Migration Path:** See DEPLOYMENT.md for Postgres/Supabase upgrade.

### 3. Draft Mode for Chats

**Decision:** Don't persist chats until first message is sent.

**Rationale:**
- Avoids empty chats in sidebar
- Better UX: Users expect chats to appear after messaging
- Reduces database writes

**Implementation:**
```typescript
// page.tsx
const chatId = params.id;
const messages = chatId !== 'new' ? await loadChat(chatId) : [];

// ChatClient.tsx
useEffect(() => {
  if (chatId === 'new' && messages.length > 0) {
    // First message sent, create chat
    createChat().then(newId => {
      router.push(`/chat/${newId}`);
    });
  }
}, [messages.length]);
```

### 4. Message Parts Architecture

**Decision:** Use typed message parts instead of plain text.

**Rationale:**
- Type safety: Each part has specific schema
- Rich rendering: Code blocks, reasoning, citations
- Tool calling: Structured tool-call/result pairs
- Extensibility: Easy to add new part types

**Example:**
```typescript
type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'reasoning'; reasoning: string }
  | { type: 'tool-call'; toolName: string; args: unknown }
  | { type: 'tool-result'; result: unknown };
```

### 5. Multi-Provider Routing

**Decision:** Support multiple AI providers (OpenAI, Groq, Gateway).

**Rationale:**
- Flexibility: Users can choose providers based on cost/performance
- Resilience: Fallback if one provider is down
- Experimentation: Easy to test different models

**Implementation:**
```typescript
export function getModel(modelId: string) {
  if (modelId.startsWith('openai/')) {
    return openai(modelId.replace('openai/', ''));
  } else if (modelId.startsWith('groq/')) {
    return groq(modelId.replace('groq/', ''));
  }
  // ...
}
```

### 6. Reasoning as Message Part

**Decision:** Extract reasoning into dedicated message parts.

**Rationale:**
- Better UX: Collapsible thought process
- Separation: Reasoning vs final answer
- Flexibility: Can hide/show reasoning

**Implementation:**
```typescript
// provider.ts middleware
experimental_transform(part) {
  if (part.type === 'reasoning' && part.reasoning) {
    return {
      type: 'reasoning',
      reasoning: part.reasoning,
    };
  }
}
```

## Extension Points

### Adding a New Tool

1. Create tool file: `src/lib/ai/tools/myTool.ts`
2. Define with `tool()` function
3. Export from `src/lib/ai/tools/index.ts`
4. Restart dev server

See `src/lib/ai/tools/examples/` for templates.

### Adding a New AI Provider

1. Install SDK: `pnpm install @ai-sdk/new-provider`
2. Add to `provider.ts`:
   ```typescript
   import { newProvider } from '@ai-sdk/new-provider';

   export function getModel(modelId: string) {
     if (modelId.startsWith('newprovider/')) {
       return newProvider(modelId.replace('newprovider/', ''));
     }
     // ...
   }
   ```
3. Add models to `models.ts`
4. Add API key to `.env.local`

### Adding a New Message Part Type

1. Define type in message schema
2. Add renderer in `MessageParts.tsx`:
   ```typescript
   if (part.type === 'my-new-part') {
     return <MyNewPartRenderer {...part} />;
   }
   ```
3. Update AI layer to emit new part type

### Switching to Database Storage

See DEPLOYMENT.md for complete Postgres/Supabase migration guide.

**Quick steps:**
1. Create database schema (SQL migrations)
2. Implement new store: `src/lib/chat/store/postgresChatStore.ts`
3. Update imports in API routes
4. Deploy with `DATABASE_URL` environment variable

### Adding Authentication

The starter is auth-agnostic. To add authentication:

1. **NextAuth.js**:
   ```bash
   pnpm install next-auth
   ```
   Add middleware, protect API routes, associate chats with user IDs.

2. **Clerk**:
   ```bash
   pnpm install @clerk/nextjs
   ```
   Wrap app in ClerkProvider, use `currentUser()` in API routes.

3. **Supabase Auth**:
   Use Supabase client, protect routes, use RLS policies.

### Customizing the UI

**Theme:**
- Edit `src/app/globals.css` for colors
- Tailwind v4 uses CSS variables for theming

**Components:**
- All UI components are in `src/components/`
- Built with shadcn/ui (fully customizable)
- No abstraction lock-in - modify directly

**Layout:**
- Sidebar: `ChatSidebar.tsx`
- Messages: `MessageParts.tsx`
- Input: `ChatClient.tsx`

---

## Next Steps

- **DEPLOYMENT.md**: Production deployment guide
- **CONTRIBUTING.md**: Contribution guidelines
- **src/lib/ai/README.md**: AI layer deep dive
- **src/lib/chat/store/README.md**: Persistence layer deep dive
- **src/lib/ai/tools/examples/README.md**: Tool development guide
