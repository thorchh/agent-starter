# Production Deployment Guide

This guide covers deploying Agent Starter to production with proper persistence, blob storage, monitoring, and optimization.

## Table of Contents

- [Quick Deploy to Vercel](#quick-deploy-to-vercel)
- [Production Persistence Setup](#production-persistence-setup)
  - [Option 1: Vercel Postgres](#option-1-vercel-postgres-recommended)
  - [Option 2: Supabase](#option-2-supabase)
  - [Option 3: Other Databases](#option-3-other-databases)
- [Blob Storage for Attachments](#blob-storage-for-attachments)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Observability](#monitoring--observability)
- [Security Checklist](#security-checklist)
- [Cost Management](#cost-management)
- [Troubleshooting](#troubleshooting)

## Quick Deploy to Vercel

The fastest way to get started (5 minutes):

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/thorchh/agent-starter.git
git push -u origin main
```

2. **Deploy to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variable: `OPENAI_API_KEY=sk-...`
   - Click **Deploy**

3. **What works immediately:**
   - ✅ Streaming chat interface
   - ✅ Tool calling (getTime, getWeather, summarizeAttachments)
   - ✅ Web search (OpenAI built-in)
   - ✅ Model switching
   - ✅ Theme toggle

4. **What needs upgrade:**
   - ⚠️ **Chat persistence** - File storage is ephemeral on Vercel (files lost between deployments)
   - ⚠️ **Attachments** - Only metadata persisted, file bytes not stored

**Next step:** Set up production persistence (see below).

## Production Persistence Setup

The starter uses file-based storage (`.chats/` directory) which is **ephemeral on serverless platforms**. You need a database for production.

### Option 1: Vercel Postgres (Recommended)

**Best for:** Vercel deployments, quick setup, PostgreSQL experience

#### 1. Create Database

In your Vercel project dashboard:
1. Go to **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose a region (same as your deployment for low latency)
5. Click **Create**

Vercel automatically adds these environment variables to your project:
```bash
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
```

#### 2. Create Database Schema

Create `sql/schema.sql`:

```sql
-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
```

Run the migration:
```bash
pnpm install @vercel/postgres
psql $POSTGRES_URL < sql/schema.sql
```

#### 3. Implement Postgres Store

Create `src/lib/chat/server/postgresChatStore.ts`:

```typescript
import { sql } from '@vercel/postgres';
import { CoreMessage } from 'ai';
import { nanoid } from 'nanoid';

export async function createChat(): Promise<string> {
  const id = nanoid();
  await sql`
    INSERT INTO chats (id, title, created_at, updated_at)
    VALUES (${id}, 'New Chat', NOW(), NOW())
  `;
  return id;
}

export async function loadChat(id: string): Promise<CoreMessage[] | null> {
  try {
    const { rows } = await sql`
      SELECT content FROM messages
      WHERE chat_id = ${id}
      ORDER BY created_at ASC
    `;

    if (rows.length === 0) {
      return null;
    }

    return rows.map(row => row.content as CoreMessage);
  } catch (error) {
    console.error('Error loading chat:', error);
    return null;
  }
}

export async function saveChat(
  id: string,
  messages: CoreMessage[]
): Promise<void> {
  try {
    // Start transaction
    await sql`BEGIN`;

    // Update chat timestamp and generate title from first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    const title = firstUserMessage
      ? String(firstUserMessage.content).slice(0, 100)
      : 'New Chat';

    await sql`
      INSERT INTO chats (id, title, updated_at)
      VALUES (${id}, ${title}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          updated_at = NOW()
    `;

    // Delete existing messages for this chat
    await sql`DELETE FROM messages WHERE chat_id = ${id}`;

    // Insert all messages
    for (const message of messages) {
      const messageId = nanoid();
      const content = JSON.stringify(message);

      await sql`
        INSERT INTO messages (id, chat_id, role, content, created_at)
        VALUES (${messageId}, ${id}, ${message.role}, ${content}::jsonb, NOW())
      `;
    }

    // Commit transaction
    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('Error saving chat:', error);
    throw error;
  }
}

export async function deleteChat(id: string): Promise<void> {
  await sql`DELETE FROM chats WHERE id = ${id}`;
  // Messages are cascade deleted via foreign key
}

export async function listChats(): Promise<Array<{
  id: string;
  title: string;
  updatedAt: Date;
}>> {
  const { rows } = await sql`
    SELECT id, title, updated_at
    FROM chats
    ORDER BY updated_at DESC
    LIMIT 100
  `;

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    updatedAt: new Date(row.updated_at),
  }));
}
```

#### 4. Update API Routes

**In `src/app/api/chat/route.ts`:**
```typescript
// Replace:
import { loadChat, saveChat } from "@/lib/chat/server/fileChatStore";
// With:
import { loadChat, saveChat } from "@/lib/chat/server/postgresChatStore";
```

**In `src/app/api/chats/route.ts`:**
```typescript
// Replace:
import { listChats } from "@/lib/chat/server/fileChatStore";
// With:
import { listChats } from "@/lib/chat/server/postgresChatStore";
```

**In `src/app/api/chats/[id]/route.ts`:**
```typescript
// Replace:
import { deleteChat } from "@/lib/chat/server/fileChatStore";
// With:
import { deleteChat } from "@/lib/chat/server/postgresChatStore";
```

#### 5. Deploy

```bash
git add .
git commit -m "Add Postgres persistence"
git push
```

Vercel will automatically deploy and use the database.

### Option 2: Supabase

**Best for:** Open-source preference, built-in auth, real-time features

#### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Set project name, database password, region
4. Wait for provisioning (~2 minutes)

#### 2. Get Connection String

In your Supabase project:
1. Go to **Settings** → **Database**
2. Copy **Connection Pooling** URL (use Transaction mode for serverless)
3. Add to Vercel environment variables:

```bash
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

#### 3. Run Schema Migration

Using the same `sql/schema.sql` from Option 1:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

Or use the Supabase SQL Editor to run the schema directly.

#### 4. Implementation

Install Postgres client:
```bash
pnpm install postgres
```

Create `src/lib/chat/server/supabaseChatStore.ts`:

```typescript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  max: 1, // Limit connections in serverless
  idle_timeout: 20,
  connect_timeout: 10,
});

// Same implementation as postgresChatStore.ts but using 'postgres' package
// See Option 1 for full implementation
```

Update API routes to import from `supabaseChatStore` instead of `fileChatStore`.

### Option 3: Other Databases

**PlanetScale (MySQL):**
```typescript
import { connect } from '@planetscale/database';

const db = connect({
  url: process.env.DATABASE_URL,
});

// Adapt schema and queries for MySQL syntax
```

**MongoDB:**
```typescript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('chat-app');

export async function saveChat(id: string, messages: CoreMessage[]) {
  await db.collection('chats').updateOne(
    { _id: id },
    {
      $set: {
        messages,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}
```

**Prisma (any database):**
```bash
pnpm install prisma @prisma/client
npx prisma init
```

Define schema in `prisma/schema.prisma` and generate client.

## Blob Storage for Attachments

The starter persists attachment **metadata only** (filename, size, mediaType). File bytes need blob storage for production.

### Option 1: Vercel Blob (Recommended)

**Best for:** Vercel deployments, simplest setup

#### 1. Enable Vercel Blob

In Vercel dashboard:
1. Go to **Storage** → **Create Database**
2. Select **Blob**
3. Connect to your project

This adds `BLOB_READ_WRITE_TOKEN` environment variable automatically.

#### 2. Install SDK

```bash
pnpm install @vercel/blob
```

#### 3. Update Attachment Handling

Create `src/lib/storage/blobStore.ts`:

```typescript
import { put, del } from '@vercel/blob';

export async function uploadAttachment(
  file: File
): Promise<{ url: string; pathname: string }> {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
  };
}

export async function deleteAttachment(url: string): Promise<void> {
  await del(url);
}
```

#### 4. Update Message Persistence

Modify your chat store to save blob URLs instead of data URLs:

```typescript
// In saveChat function
for (const message of messages) {
  if (message.role === 'user' && message.experimental_attachments) {
    // Upload attachments and store URLs
    for (const attachment of message.experimental_attachments) {
      if (attachment.url?.startsWith('data:')) {
        // Convert data URL to File and upload
        const file = dataURLtoFile(attachment.url, attachment.name);
        const { url } = await uploadAttachment(file);
        attachment.url = url;
      }
    }
  }
}
```

### Option 2: AWS S3

```bash
pnpm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAttachment(file: File) {
  const key = `attachments/${nanoid()}-${file.name}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));

  return {
    url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
    pathname: key,
  };
}
```

### Option 3: Cloudflare R2

Same as S3 but with R2 endpoint:

```typescript
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

## Performance Optimization

### 1. Enable Edge Runtime

For faster response times, use Edge runtime for API routes:

```typescript
// src/app/api/chat/route.ts
export const runtime = 'edge';

export async function POST(req: Request) {
  // Your existing code
}
```

**Note:** Ensure your database client supports Edge runtime (Vercel Postgres, Neon, etc.).

### 2. Response Streaming

Already implemented via `streamText(...).toUIMessageStreamResponse()`.

Ensure you're not blocking the stream:
- ❌ Don't await the entire stream before sending
- ✅ Let AI SDK handle streaming automatically

### 3. Database Connection Pooling

Use connection pooling URLs:

```bash
# Vercel Postgres (automatic)
POSTGRES_URL # Pooled connection

# Supabase
DATABASE_URL # Use Transaction mode pooler

# Neon
DATABASE_URL # Use pooled endpoint
```

Limit connections in serverless:
```typescript
const sql = postgres(process.env.DATABASE_URL!, {
  max: 1, // Important for serverless
});
```

### 4. Caching

Cache static model lists and system prompts:

```typescript
// src/lib/ai/models.ts
export const MODEL_OPTIONS = [
  // ... defined once, no runtime generation
] as const;
```

For chat lists, add HTTP caching:
```typescript
// src/app/api/chats/route.ts
export async function GET() {
  const chats = await listChats();

  return Response.json(chats, {
    headers: {
      'Cache-Control': 'private, max-age=60', // Cache for 1 minute
    },
  });
}
```

### 5. Bundle Size

Analyze bundle size:
```bash
pnpm build
# Check .next/server and .next/static sizes
```

Reduce bundle:
- Use dynamic imports for large components
- Tree-shake unused UI components
- Consider removing unused shadcn components

## Monitoring & Observability

### 1. Vercel Analytics

Enable in dashboard:
1. Go to **Analytics** tab
2. Click **Enable**

Track custom events:
```typescript
import { track } from '@vercel/analytics';

track('chat_created', { modelId });
track('tool_called', { toolName });
```

### 2. Error Tracking (Sentry)

```bash
pnpm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure in `sentry.client.config.ts`:
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### 3. OpenAI Usage Tracking

Log token usage:
```typescript
// In api/chat/route.ts
const result = await streamText({
  // ... config
});

result.usage.then(usage => {
  console.log('Token usage:', {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  });

  // Store in database for billing/analytics
  await logUsage(chatId, modelId, usage);
});
```

### 4. Database Monitoring

**Vercel Postgres:**
- Dashboard shows queries, connections, storage
- Set up alerts for high usage

**Supabase:**
- Built-in observability dashboard
- Real-time query performance
- Connection pool monitoring

## Security Checklist

Before going to production:

### API Keys
- ✅ Store all API keys in environment variables (never in code)
- ✅ Use different keys for development/production
- ✅ Rotate keys regularly
- ✅ Monitor API key usage in provider dashboards

### Model Allowlist
- ✅ Review `ALLOWED_MODEL_IDS` in `src/lib/ai/models.ts`
- ✅ Remove expensive models if not needed (o1, gpt-5)
- ✅ Server-side validation prevents unauthorized model use

### Database
- ✅ Use connection pooling (prevents connection exhaustion)
- ✅ Enable SSL for database connections
- ✅ Limit query complexity (e.g., max 100 chats returned)
- ✅ Use parameterized queries (prevents SQL injection)

### Rate Limiting
Add rate limiting to API routes:

```bash
pnpm install @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

// In api/chat/route.ts
const { success } = await ratelimit.limit(userId || ip);
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Content Safety
- ✅ Use OpenAI moderation API for user input
- ✅ Implement content filtering for sensitive topics
- ✅ Log and review flagged content

```typescript
import { openai } from '@ai-sdk/openai';

const moderation = await openai.moderations.create({
  input: userMessage,
});

if (moderation.results[0].flagged) {
  return new Response('Content policy violation', { status: 400 });
}
```

### CORS
Configure CORS if using API from different domain:

```typescript
// src/app/api/chat/route.ts
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://yourdomain.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

## Cost Management

### OpenAI Cost Optimization

**1. Use cheaper models when possible:**
- Development: `gpt-4o-mini` ($0.15/$0.60 per 1M tokens)
- Production: `gpt-4o` ($2.50/$10 per 1M tokens)
- Reasoning: `o4-mini` ($6/$24 per 1M tokens, slower)

**2. Limit context length:**
```typescript
const result = await streamText({
  maxTokens: 2000, // Limit response length
  messages: messages.slice(-10), // Keep last 10 messages only
});
```

**3. Monitor usage:**
- Set up billing alerts in OpenAI dashboard
- Track usage per user/session
- Implement spending caps

### Database Cost Optimization

**Vercel Postgres:**
- Free tier: 256 MB storage, 60 hours compute/month
- Pro tier: $0.10/GB storage, $0.06/compute hour

**Optimization tips:**
- Delete old chats (e.g., after 30 days)
- Compress message content (gzip)
- Paginate chat lists (don't load all at once)

**Auto-cleanup old chats:**
```sql
-- Run weekly via cron job
DELETE FROM chats
WHERE updated_at < NOW() - INTERVAL '30 days';
```

### Blob Storage Cost Optimization

**Vercel Blob:**
- Free tier: 500 MB, 10K reads, 10K writes/month
- Pro tier: $0.15/GB storage, $5/1M reads

**Optimization:**
- Limit attachment size (e.g., 10 MB max)
- Delete attachments when chat is deleted
- Use image compression before upload

## Troubleshooting

### "Missing API key" in production

**Problem:** Environment variables not set in Vercel

**Solution:**
1. Go to Vercel project → Settings → Environment Variables
2. Add `OPENAI_API_KEY` with your key
3. Redeploy the project

### "Database connection failed"

**Problem:** Connection string invalid or database not accessible

**Solutions:**
- Verify `DATABASE_URL` or `POSTGRES_URL` is set correctly
- Check database is in same region as deployment
- For Supabase: Use pooling URL, not direct connection
- For serverless: Set `max: 1` connections

### "Chat not persisting"

**Problem:** Still using file-based storage on Vercel

**Solution:**
- Confirm you've updated API route imports to use postgres/supabase store
- Check database migrations ran successfully
- Verify tables exist: `SELECT * FROM chats LIMIT 1;`

### "Attachments not loading"

**Problem:** Blob storage not configured or URLs expired

**Solutions:**
- Ensure `BLOB_READ_WRITE_TOKEN` is set (Vercel Blob)
- Check blob URLs are publicly accessible
- For S3: Verify bucket CORS and public access settings

### "Slow response times"

**Possible causes:**
- Database in different region (add connection pooling)
- No Edge runtime enabled (add `export const runtime = 'edge'`)
- Large message history (limit to last N messages)
- Model is slow (o-series models take 10-30s)

**Solutions:**
- Enable Edge runtime in API routes
- Use connection pooling
- Implement message history limits
- Use faster models for development

### "Rate limit errors from OpenAI"

**Problem:** Hitting OpenAI rate limits

**Solutions:**
- Check your OpenAI tier (free/tier 1/tier 2)
- Implement retry logic with exponential backoff
- Add user-facing rate limiting
- Request tier upgrade if needed

### Build errors on Vercel

**Common issues:**
- TypeScript errors: Run `pnpm build` locally first
- Missing dependencies: Ensure all packages in `package.json`
- Environment variables: Build-time vars need `NEXT_PUBLIC_` prefix

**Debug:**
```bash
# Local build test
pnpm build

# Check for TypeScript errors
pnpm tsc --noEmit
```

---

## Next Steps

After deploying:

1. **Add Authentication**
   - NextAuth.js for social login
   - Clerk for drop-in auth
   - Supabase Auth for open-source option

2. **Implement Usage Tracking**
   - Track tokens per user
   - Set spending limits
   - Generate usage reports

3. **Add Collaboration Features**
   - Share chats via URL
   - Team workspaces
   - Role-based access control

4. **Custom Domain**
   - Add custom domain in Vercel
   - Configure DNS records
   - Enable automatic HTTPS

5. **Monitoring Dashboard**
   - Aggregate analytics
   - Track error rates
   - Monitor API costs

For more help, see:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel AI SDK Docs](https://ai-sdk.dev)
- [Supabase Docs](https://supabase.com/docs)
