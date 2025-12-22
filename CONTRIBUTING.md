# Contributing to Agent Workflow Starter

Thank you for your interest in contributing! This guide will help you get started with development and understand the project's contribution workflow.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style & Standards](#code-style--standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Getting Started

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

### First-Time Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/agent-workflow-starter.git
   cd agent-workflow-starter
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   ```bash
   OPENAI_API_KEY=sk-...
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open the app**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You should see the landing page

### Verify Your Setup

Test that everything works:

1. **Create a new chat** - Click "New Chat" button
2. **Send a message** - Type "What time is it?" and press Send
3. **Verify tool calling** - The AI should call the `getTime` tool
4. **Check streaming** - Response should stream in real-time

If any of these fail, see [Troubleshooting](#troubleshooting).

## Development Setup

### Recommended VS Code Extensions

Install these extensions for the best development experience:

- **ESLint** (`dbaeumer.vscode-eslint`) - Linting
- **Prettier** (`esbenp.prettier-vscode`) - Code formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) - Tailwind autocomplete
- **TypeScript** (built-in) - Type checking

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Environment Variables

The project uses these environment variables:

**Required:**
- `OPENAI_API_KEY` - OpenAI API key for GPT models

**Optional:**
- `GROQ_API_KEY` - Groq API key for Llama/Mixtral models
- `AI_GATEWAY_API_KEY` - AI Gateway key for unified endpoint
- `AI_MODEL` - Default model ID (e.g., `openai/gpt-4o`)
- `ENABLE_REASONING` - Enable reasoning summaries for o-series models
- `OPENAI_REASONING_SUMMARY` - Reasoning detail level (`auto` or `detailed`)
- `OPENAI_REASONING_EFFORT` - Reasoning effort (`minimal`, `low`, `medium`, `high`)

See `.env.example` for full documentation.

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (chat, chats)
│   ├── chat/[id]/            # Chat page
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Root layout
│
├── components/               # React components
│   ├── chat/                 # Chat UI (ChatClient, ChatSidebar, MessageParts)
│   └── ui/                   # shadcn/ui primitives
│
├── lib/                      # Core libraries
│   ├── ai/                   # AI layer (provider, models, tools)
│   ├── chat/                 # Chat persistence (store implementations)
│   └── utils.ts              # Shared utilities
│
└── hooks/                    # Custom React hooks
```

For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Development Workflow

### Creating a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following [Code Style](#code-style--standards)
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   pnpm dev        # Manual testing
   pnpm build      # Production build test
   pnpm lint       # Check linting
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```

   Then open a Pull Request on GitHub.

### Common Development Tasks

#### Adding a New Tool

```bash
# 1. Create tool file
touch src/lib/ai/tools/myTool.ts

# 2. Implement tool (see examples/)
# 3. Export from src/lib/ai/tools/index.ts
# 4. Restart dev server
```

See [Tool Development Guide](./src/lib/ai/tools/examples/README.md) for detailed instructions.

#### Adding a New Model

```typescript
// src/lib/ai/models.ts

// 1. Add to MODEL_OPTIONS
{
  id: 'provider/model-name',
  name: 'Model Name',
  provider: 'provider',
  supportsReasoning: false,
  supportsTools: true,
}

// 2. Add to ALLOWED_MODEL_IDS
'provider/model-name',

// 3. Update getModel() in provider.ts if needed
```

#### Updating UI Components

```bash
# shadcn/ui components are in src/components/ui/
# To add a new component:
npx shadcn-ui@latest add button

# To modify existing components, edit directly:
# src/components/ui/button.tsx
```

#### Database Migration (Production)

```bash
# For Postgres/Supabase deployments
# 1. Create migration file
touch sql/002_migration_name.sql

# 2. Write migration SQL
# 3. Apply migration
psql $DATABASE_URL < sql/002_migration_name.sql
```

## Code Style & Standards

### TypeScript

- **Strict mode enabled** - All code must pass TypeScript checks
- **No `any` types** - Use proper typing or `unknown`
- **Prefer interfaces** for object shapes
- **Use const** over let when possible

**Good:**
```typescript
interface User {
  id: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  // ...
};
```

**Bad:**
```typescript
const getUser = async (id: any) => {
  // ...
};
```

### React Components

- **Use functional components** with hooks
- **Prefer server components** unless you need client-side features
- **Mark client components** with `'use client'` directive
- **Extract complex logic** into custom hooks

**Server Component (default):**
```typescript
// src/app/page.tsx
export default async function Page() {
  const data = await fetchData(); // Can use async/await
  return <div>{data}</div>;
}
```

**Client Component:**
```typescript
// src/components/chat/ChatClient.tsx
'use client';

import { useState } from 'react';

export function ChatClient() {
  const [state, setState] = useState();
  // ...
}
```

### File Naming

- **Components**: PascalCase (e.g., `ChatClient.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **API routes**: kebab-case directories (e.g., `api/chats/[id]/route.ts`)
- **Types**: PascalCase (e.g., `types.ts` with `export type User = ...`)

### Import Order

```typescript
// 1. External packages
import { useChat } from 'ai/react';
import { useState } from 'react';

// 2. Internal absolute imports
import { Button } from '@/components/ui/button';
import { loadChat } from '@/lib/chat/server/fileChatStore';

// 3. Relative imports
import { formatDate } from './utils';

// 4. Types
import type { CoreMessage } from 'ai';
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat: add web search toggle
fix: resolve streaming timeout issue
docs: update deployment guide
refactor: extract citation utilities
test: add tool calling tests
chore: update dependencies
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `refactor` - Code refactoring
- `test` - Add/update tests
- `chore` - Maintenance tasks

### Code Formatting

- **Prettier** handles formatting automatically
- **Run before committing**: `pnpm format`
- **2 spaces** for indentation
- **Single quotes** for strings
- **Trailing commas** in multi-line objects/arrays

### Comments

**Use comments sparingly** - prefer self-documenting code.

**Good comments:**
```typescript
// WORKAROUND: Vercel Blob SDK requires base64 encoding
const base64 = Buffer.from(data).toString('base64');

// Calculate token cost: $0.005 per 1K tokens
const cost = (tokens / 1000) * 0.005;
```

**Bad comments:**
```typescript
// Loop through users
users.forEach(user => {
  // Send email to user
  sendEmail(user.email);
});
```

**Use JSDoc for public APIs:**
```typescript
/**
 * Load chat messages by ID from persistent storage.
 *
 * @param id - The chat ID
 * @returns Array of messages, or null if chat not found
 */
export async function loadChat(id: string): Promise<CoreMessage[] | null> {
  // ...
}
```

## Testing

### Manual Testing Checklist

Before submitting a PR, verify:

- [ ] **Chat creation** - Can create new chats
- [ ] **Message sending** - Messages send and stream correctly
- [ ] **Tool calling** - Tools execute (try "What time is it?")
- [ ] **Chat history** - Sidebar shows chats grouped by time
- [ ] **Chat deletion** - Can delete chats
- [ ] **Model switching** - Can switch between models
- [ ] **Theme toggle** - Light/dark mode works
- [ ] **Mobile responsive** - Test on mobile viewport
- [ ] **Production build** - `pnpm build` succeeds

### Automated Testing

Currently, the project uses manual testing. Automated tests are planned for:

- Unit tests (Jest)
- Integration tests (Playwright)
- E2E tests (Playwright)

Contributions to add testing infrastructure are welcome!

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run checks**
   ```bash
   pnpm lint       # Check linting
   pnpm build      # Ensure builds successfully
   pnpm format     # Format code
   ```

3. **Write a clear PR description**
   - What does this PR do?
   - Why is this change needed?
   - How has it been tested?
   - Screenshots (if UI changes)

4. **Request review**
   - Tag relevant reviewers
   - Respond to feedback
   - Make requested changes

5. **Merge**
   - Squash commits if there are many small commits
   - Use merge commit for features
   - Delete branch after merge

### PR Title Format

```
type(scope): description

feat(tools): add database query tool template
fix(chat): resolve message streaming timeout
docs(readme): update deployment instructions
```

### Review Criteria

PRs are reviewed for:

- **Functionality** - Does it work as intended?
- **Code quality** - Follows style guidelines, well-structured
- **Performance** - No unnecessary re-renders, efficient queries
- **Security** - No vulnerabilities, API keys protected
- **Documentation** - README/docs updated if needed
- **Tests** - Manual testing completed (automated tests if applicable)

## Release Process

Releases follow semantic versioning:

- **Major** (x.0.0) - Breaking changes
- **Minor** (0.x.0) - New features (backwards compatible)
- **Patch** (0.0.x) - Bug fixes

### Creating a Release

1. Update version in `package.json`
2. Update CHANGELOG.md with release notes
3. Create a git tag: `git tag v1.2.3`
4. Push tag: `git push origin v1.2.3`
5. GitHub Actions creates the release automatically

## Troubleshooting

### Common Issues

**"Module not found" errors**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

**TypeScript errors**
```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

**Build fails**
```bash
# Check for TypeScript errors
pnpm tsc --noEmit

# Check for linting errors
pnpm lint
```

**Chat not persisting**
```bash
# Check that .chats/ directory exists
mkdir .chats

# Verify file permissions
ls -la .chats/
```

**Tool calling not working**
```bash
# Check that tool is exported in src/lib/ai/tools/index.ts
# Verify tool has proper description and inputSchema
# Restart dev server
```

### Getting Help

- **Documentation**: See [README.md](./README.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/agent-workflow-starter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/agent-workflow-starter/discussions)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Welcome newcomers and help them learn

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing!** Your efforts help make this project better for everyone.
