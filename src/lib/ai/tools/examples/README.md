# Tool Development Examples

This directory contains template tools demonstrating common patterns for extending your AI agent with custom capabilities.

## Quick Start

To add a new tool to your agent:

1. **Create a new file** in `src/lib/ai/tools/` (e.g., `myTool.ts`)
2. **Define the tool** using the AI SDK `tool()` function
3. **Export it** from `src/lib/ai/tools/index.ts`
4. **Restart** the dev server

The AI will automatically have access to your new tool.

## Tool Anatomy

Every tool has three parts:

```typescript
import { tool } from 'ai';
import { z } from 'zod/v3';

export const myTool = tool({
  // 1. Description - tells the AI when to use this tool
  description: 'Get user account information by email address',

  // 2. Input Schema - Zod schema for type-safe input validation
  inputSchema: z.object({
    email: z.string().email().describe('The user email address'),
  }),

  // 3. Execute - async function that performs the action
  execute: async ({ email }) => {
    // Your implementation here
    const user = await db.users.findByEmail(email);
    return user;
  },
});
```

## Writing Good Tool Descriptions

The description is critical - it determines when the AI calls your tool.

**❌ Bad descriptions (too vague):**
```typescript
description: 'Gets data'
description: 'Searches'
description: 'Processes information'
```

**✅ Good descriptions (specific):**
```typescript
description: 'Search the product catalog by name, category, or SKU'
description: 'Send a transactional email to a user with HTML template support'
description: 'Query the customer database by email, user ID, or phone number'
```

**Tips:**
- Be specific about what data the tool accesses
- Mention key parameters the tool accepts
- Describe the output format if relevant
- Use action verbs (search, send, create, update, delete)

## Input Schema Best Practices

Use Zod's `.describe()` to help the AI understand each parameter:

```typescript
inputSchema: z.object({
  // ✅ Good - clear description
  query: z.string().describe('The search query (keywords or phrases)'),
  limit: z.number().optional().describe('Maximum results to return (default 10)'),

  // ❌ Bad - no description
  query: z.string(),
  limit: z.number().optional(),
}),
```

**Common patterns:**

```typescript
// Email validation
email: z.string().email().describe('User email address'),

// Enum for limited choices
status: z.enum(['pending', 'approved', 'rejected']).describe('Order status'),

// Optional with default
limit: z.number().default(10).describe('Number of results (default 10)'),

// Arrays
tags: z.array(z.string()).describe('List of product tags to filter by'),

// Nested objects
address: z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string(),
}).describe('Shipping address'),
```

## Example Templates

This directory contains working examples for common use cases:

### 1. Database Queries (`mockDatabase.ts`)

Shows how to:
- Query a database (Postgres, MySQL, MongoDB, etc.)
- Handle different query types (by ID, email, search)
- Return structured data
- Handle errors gracefully

**Use this template for:**
- User lookups
- Product catalog searches
- Order history queries
- Analytics data retrieval

### 2. External API Calls (`sendEmail.ts`)

Shows how to:
- Call third-party APIs (Resend, SendGrid, etc.)
- Handle API authentication
- Validate responses
- Implement retry logic

**Use this template for:**
- Sending emails/SMS
- Payment processing
- Shipping integrations
- CRM updates
- Webhook triggers

### 3. Custom Search (`searchCustomAPI.ts`)

Shows how to:
- Integrate search providers (Tavily, SerpAPI, Exa)
- Format search results
- Handle pagination
- Return citations/sources

**Use this template for:**
- Web search (alternative to OpenAI built-in)
- Document search
- Knowledge base queries
- Vector similarity search

## Tool Organization

As your tool library grows, organize them into logical groups:

```
src/lib/ai/tools/
├── index.ts                    # Main registry
├── database/
│   ├── getUser.ts
│   ├── searchProducts.ts
│   └── getOrder.ts
├── communication/
│   ├── sendEmail.ts
│   ├── sendSMS.ts
│   └── createTicket.ts
├── search/
│   ├── webSearch.ts
│   └── documentSearch.ts
└── examples/                   # Templates (this directory)
    ├── mockDatabase.ts
    ├── sendEmail.ts
    └── searchCustomAPI.ts
```

Then export groups in `index.ts`:

```typescript
// Database tools
import { getUser } from './database/getUser';
import { searchProducts } from './database/searchProducts';

// Communication tools
import { sendEmail } from './communication/sendEmail';

export const tools = {
  // Database
  getUser,
  searchProducts,

  // Communication
  sendEmail,
};
```

## Conditional Tool Availability

You can enable/disable tools based on context:

```typescript
// Only include admin tools for admin users
export function getToolsForUser(userRole: string) {
  const baseTool = { getTime, getWeather };

  if (userRole === 'admin') {
    return {
      ...baseTools,
      deleteUser,
      refundOrder,
    };
  }

  return baseTools;
}
```

## Error Handling

Always handle errors gracefully in tools:

```typescript
execute: async ({ userId }) => {
  try {
    const user = await db.users.findById(userId);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      success: false,
      error: 'Database error occurred',
    };
  }
}
```

**Why return structured errors?**
- The AI can read the error and explain it to the user
- Prevents cryptic error messages in the UI
- Allows retry logic or alternative approaches

## Testing Tools

Test tools independently before integrating:

```typescript
// __tests__/tools/myTool.test.ts
import { myTool } from '@/lib/ai/tools/myTool';

describe('myTool', () => {
  it('should return user data for valid email', async () => {
    const result = await myTool.execute({
      email: 'test@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('email');
  });

  it('should handle invalid email gracefully', async () => {
    const result = await myTool.execute({
      email: 'invalid@test.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Performance Considerations

### 1. Timeout Long Operations

```typescript
execute: async ({ query }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const result = await fetch(apiUrl, { signal: controller.signal });
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      return { error: 'Request timeout' };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

### 2. Cache Expensive Operations

```typescript
import { unstable_cache } from 'next/cache';

const getCachedProducts = unstable_cache(
  async () => db.products.findAll(),
  ['all-products'],
  { revalidate: 3600 } // Cache for 1 hour
);

export const searchProducts = tool({
  description: 'Search the product catalog',
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    const products = await getCachedProducts();
    return products.filter(p => p.name.includes(query));
  },
});
```

### 3. Limit Response Size

```typescript
execute: async ({ query }) => {
  const results = await search(query);

  // Don't return huge arrays to the AI
  return {
    total: results.length,
    results: results.slice(0, 10), // Limit to 10 results
    hasMore: results.length > 10,
  };
}
```

## Security

### 1. Validate User Intent

For destructive operations, require confirmation:

```typescript
export const deleteUser = tool({
  description: 'Permanently delete a user account. DESTRUCTIVE ACTION.',
  parameters: z.object({
    userId: z.string(),
    confirm: z.literal(true).describe('Must be true to confirm deletion'),
  }),
  execute: async ({ userId, confirm }) => {
    if (!confirm) {
      return { error: 'Deletion must be explicitly confirmed' };
    }

    await db.users.delete(userId);
    return { success: true };
  },
});
```

### 2. Sanitize Inputs

```typescript
import { escape } from 'html-escaper';

execute: async ({ message }) => {
  // Prevent XSS in email content
  const sanitized = escape(message);

  await sendEmail({
    body: sanitized,
  });
}
```

### 3. Check Permissions

```typescript
execute: async ({ orderId, userId }) => {
  // Verify user owns this order
  const order = await db.orders.findById(orderId);

  if (order.userId !== userId) {
    return { error: 'Unauthorized' };
  }

  // Proceed with operation
  return order;
}
```

## Advanced Patterns

### Multi-Step Tools

Some operations require multiple tool calls:

```typescript
// The AI will automatically chain these
export const placeOrder = tool({
  description: 'Create a new order',
  // ...
});

export const processPayment = tool({
  description: 'Process payment for an order',
  // ...
});

export const sendOrderConfirmation = tool({
  description: 'Send order confirmation email',
  // ...
});

// AI conversation:
// User: "I want to order the blue shirt"
// AI calls: placeOrder({ productId: '123', ... })
// AI calls: processPayment({ orderId: 'abc', ... })
// AI calls: sendOrderConfirmation({ orderId: 'abc' })
```

### Streaming Tool Results

For long-running operations, you can stream partial results:

```typescript
import { createStreamableValue } from 'ai/rsc';

export const generateReport = tool({
  description: 'Generate a detailed analytics report',
  parameters: z.object({ type: z.enum(['sales', 'users']) }),
  execute: async ({ type }) => {
    const stream = createStreamableValue();

    (async () => {
      stream.update({ status: 'Fetching data...' });
      const data = await fetchData(type);

      stream.update({ status: 'Analyzing trends...' });
      const analysis = await analyze(data);

      stream.update({ status: 'Generating charts...' });
      const charts = await generateCharts(analysis);

      stream.done({ analysis, charts });
    })();

    return stream.value;
  },
});
```

## Debugging Tools

Enable debug mode in the UI to see:
- Tool input parameters
- Tool execution results
- Tool call timing

Or add logging:

```typescript
execute: async (params) => {
  console.log('[Tool] myTool called with:', params);

  const result = await doSomething(params);

  console.log('[Tool] myTool result:', result);

  return result;
}
```

## Next Steps

1. **Browse the example templates** in this directory
2. **Copy and modify** an example that matches your use case
3. **Test thoroughly** before deploying to production
4. **Read the AI SDK docs** for advanced features: [ai-sdk.dev](https://ai-sdk.dev)

## Resources

- **AI SDK Tools Documentation**: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- **Zod Documentation**: https://zod.dev
- **Vercel AI SDK Examples**: https://github.com/vercel/ai/tree/main/examples

---

**Questions or need help?** Check the main project README or open an issue.
