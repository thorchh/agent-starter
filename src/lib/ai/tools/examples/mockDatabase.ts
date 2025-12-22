/**
 * Example Tool: Database Query
 *
 * This template shows how to create a tool that queries a database.
 *
 * USAGE:
 * 1. Replace the mock database with your actual database client
 *    (Postgres, MySQL, MongoDB, Prisma, Drizzle, etc.)
 * 2. Update the schema to match your data model
 * 3. Export this tool from `src/lib/ai/tools/index.ts`
 * 4. Restart the dev server
 *
 * The AI will automatically use this tool when users ask about user data.
 */

import { tool } from 'ai';
import { z } from 'zod/v3';

// ============================================================================
// DATABASE CLIENT SETUP
// ============================================================================

/**
 * Replace this mock database with your actual database client.
 *
 * Examples:
 *
 * Vercel Postgres:
 *   import { sql } from '@vercel/postgres';
 *
 * Supabase:
 *   import postgres from 'postgres';
 *   const sql = postgres(process.env.DATABASE_URL!);
 *
 * Prisma:
 *   import { PrismaClient } from '@prisma/client';
 *   const prisma = new PrismaClient();
 *
 * MongoDB:
 *   import { MongoClient } from 'mongodb';
 *   const client = new MongoClient(process.env.MONGODB_URI!);
 *   const db = client.db('myapp');
 */

// Mock database for demonstration
const mockDatabase = {
  users: [
    {
      id: '1',
      email: 'alice@example.com',
      name: 'Alice Johnson',
      role: 'admin',
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      email: 'bob@example.com',
      name: 'Bob Smith',
      role: 'user',
      createdAt: '2024-02-20T14:45:00Z',
    },
    {
      id: '3',
      email: 'carol@example.com',
      name: 'Carol Williams',
      role: 'user',
      createdAt: '2024-03-10T09:15:00Z',
    },
  ],
};

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const getUserFromDatabase = tool({
  /**
   * Description: Tells the AI when to use this tool.
   *
   * Be specific about:
   * - What data this tool accesses
   * - What parameters it accepts
   * - When it should be used vs other tools
   */
  description:
    'Query the user database by email address or user ID. Returns user profile information including name, role, and account creation date.',

  /**
   * Parameters: Zod schema for type-safe input validation.
   *
   * The AI will see the parameter descriptions and use them to decide
   * what values to pass when calling this tool.
   *
   * Best practices:
   * - Use .describe() on every field
   * - Make fields optional when appropriate
   * - Use .refine() for complex validation
   * - Provide clear error messages
   */
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The search query - can be an email address (e.g. alice@example.com) or user ID (e.g. user_123)'
      ),
    includeMetadata: z
      .boolean()
      .optional()
      .describe(
        'Whether to include account metadata like creation date (default: false)'
      ),
  }),

  /**
   * Execute: The async function that performs the database query.
   *
   * Best practices:
   * - Always return structured data (objects, not raw strings)
   * - Handle errors gracefully (try/catch)
   * - Return success/error status
   * - Log errors for debugging
   * - Validate inputs even though Zod does it
   * - Use connection pooling for serverless
   */
  execute: async ({ query, includeMetadata = false }) => {
    try {
      // ====================================================================
      // REPLACE THIS SECTION WITH YOUR DATABASE QUERY
      // ====================================================================

      // Example with Vercel Postgres:
      /*
      const result = await sql`
        SELECT id, email, name, role, created_at
        FROM users
        WHERE email = ${query} OR id = ${query}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const user = result.rows[0];
      */

      // Example with Prisma:
      /*
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: query },
            { id: query },
          ],
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }
      */

      // Example with MongoDB:
      /*
      const user = await db.collection('users').findOne({
        $or: [
          { email: query },
          { _id: query },
        ],
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }
      */

      // Mock implementation (replace with above)
      const user = mockDatabase.users.find(
        (u) => u.email === query || u.id === query
      );

      if (!user) {
        return {
          success: false,
          error: `No user found matching "${query}"`,
        };
      }

      // ====================================================================
      // FORMAT THE RESPONSE
      // ====================================================================

      /**
       * Return a structured response that the AI can understand.
       *
       * Tips:
       * - Use clear key names
       * - Include only necessary data (don't return passwords!)
       * - Format dates as ISO strings
       * - Use success/error pattern for consistency
       */

      const response: {
        success: true;
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
          createdAt?: string;
        };
      } = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      // Conditionally include metadata
      if (includeMetadata) {
        response.user.createdAt = user.createdAt;
      }

      return response;
    } catch (error) {
      // ====================================================================
      // ERROR HANDLING
      // ====================================================================

      /**
       * Always catch and handle errors gracefully.
       *
       * Don't throw errors - return structured error objects instead.
       * This lets the AI read the error and explain it to the user.
       */

      console.error('[Tool] getUserFromDatabase error:', error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred while querying the database',
      };
    }
  },
});

// ============================================================================
// ADDITIONAL EXAMPLES
// ============================================================================

/**
 * Example: Search with pagination
 */
export const searchUsers = tool({
  description:
    'Search for users by name or email with pagination support. Returns a list of matching users.',

  inputSchema: z.object({
    query: z.string().describe('Search query (name or email fragment)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe('Maximum number of results to return (1-100, default 10)'),
    offset: z
      .number()
      .min(0)
      .default(0)
      .describe('Number of results to skip for pagination (default 0)'),
  }),

  execute: async ({ query, limit = 10, offset = 0 }) => {
    try {
      // Real database query would look like:
      /*
      const result = await sql`
        SELECT id, email, name, role
        FROM users
        WHERE name ILIKE ${'%' + query + '%'}
           OR email ILIKE ${'%' + query + '%'}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const users = result.rows;
      */

      // Mock implementation
      const lowerQuery = query.toLowerCase();
      const allMatches = mockDatabase.users.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerQuery) ||
          u.email.toLowerCase().includes(lowerQuery)
      );

      const users = allMatches.slice(offset, offset + limit);

      return {
        success: true,
        users,
        total: allMatches.length,
        hasMore: offset + limit < allMatches.length,
      };
    } catch (error) {
      console.error('[Tool] searchUsers error:', error);
      return {
        success: false,
        error: 'Failed to search users',
      };
    }
  },
});

/**
 * Example: Aggregation query
 */
export const getUserStats = tool({
  description:
    'Get user statistics including total count and breakdown by role.',

  inputSchema: z.object({}), // No parameters needed

  execute: async () => {
    try {
      // Real database query:
      /*
      const result = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as users
        FROM users
      `;

      const stats = result.rows[0];
      */

      // Mock implementation
      const total = mockDatabase.users.length;
      const admins = mockDatabase.users.filter((u) => u.role === 'admin')
        .length;
      const users = mockDatabase.users.filter((u) => u.role === 'user').length;

      return {
        success: true,
        stats: {
          total,
          admins,
          users,
        },
      };
    } catch (error) {
      console.error('[Tool] getUserStats error:', error);
      return {
        success: false,
        error: 'Failed to retrieve user statistics',
      };
    }
  },
});

// ============================================================================
// USAGE NOTES
// ============================================================================

/**
 * To use these tools:
 *
 * 1. Replace mock database with your actual database client
 * 2. Update queries to match your schema
 * 3. Export desired tools from src/lib/ai/tools/index.ts:
 *
 *    import { getUserFromDatabase, searchUsers } from './examples/mockDatabase';
 *
 *    export const tools = {
 *      getUserFromDatabase,
 *      searchUsers,
 *      // ... other tools
 *    };
 *
 * 4. Restart dev server
 *
 * The AI will automatically use these tools when appropriate.
 */

/**
 * Security considerations:
 *
 * - Never return sensitive data (passwords, tokens, API keys)
 * - Validate user permissions before queries
 * - Use parameterized queries (prevents SQL injection)
 * - Limit query results (prevent resource exhaustion)
 * - Log access for audit trails
 * - Rate limit tool calls in production
 */

/**
 * Performance tips:
 *
 * - Use connection pooling (max: 1 for serverless)
 * - Add database indexes on frequently queried fields
 * - Cache results when appropriate (unstable_cache)
 * - Limit response size (don't return huge arrays)
 * - Consider read replicas for analytics queries
 */
