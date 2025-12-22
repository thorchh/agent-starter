/**
 * Example Tool: Custom Web Search
 *
 * This template shows how to integrate custom search providers as an alternative
 * to OpenAI's built-in web_search tool.
 *
 * USAGE:
 * 1. Choose a search provider (Tavily, SerpAPI, Exa, Brave, etc.)
 * 2. Install the SDK or use fetch for API calls
 * 3. Add API key to .env.local
 * 4. Update the implementation below
 * 5. Export this tool from `src/lib/ai/tools/index.ts`
 * 6. Restart the dev server
 *
 * The AI will automatically use this tool when users ask to search the web.
 */

import { tool } from 'ai';
import { z } from 'zod/v3';

// ============================================================================
// SEARCH PROVIDER SETUP
// ============================================================================

/**
 * Search Provider Options:
 *
 * 1. Tavily (recommended for AI apps)
 *    - Best for: AI-optimized search results
 *    - Pricing: $0.005 per search (1000 free/month)
 *    - Install: pnpm install @tavily/core
 *    - Docs: https://docs.tavily.com
 *
 * 2. SerpAPI (Google, Bing, etc.)
 *    - Best for: Traditional search results
 *    - Pricing: $50/month for 5000 searches
 *    - Install: pnpm install serpapi
 *    - Docs: https://serpapi.com/docs
 *
 * 3. Exa (AI-native search)
 *    - Best for: High-quality, AI-optimized content
 *    - Pricing: $10/month starter
 *    - Install: pnpm install exa-js
 *    - Docs: https://docs.exa.ai
 *
 * 4. Brave Search API
 *    - Best for: Privacy-focused search
 *    - Pricing: Free tier available
 *    - Uses: fetch (no SDK needed)
 *    - Docs: https://brave.com/search/api/
 *
 * 5. OpenAI Built-in (default)
 *    - Best for: Simplicity (no extra cost beyond GPT)
 *    - Enable via UI toggle (already implemented)
 *    - No code needed
 */

// ============================================================================
// TAVILY IMPLEMENTATION (RECOMMENDED)
// ============================================================================

export const searchWeb = tool({
  description:
    'Search the web for current information, news, articles, or general knowledge. Returns relevant results with titles, snippets, and URLs that can be cited.',

  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe('The search query or question to search for'),

    maxResults: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe('Maximum number of search results to return (1-10, default 5)'),

    searchDepth: z
      .enum(['basic', 'advanced'])
      .default('basic')
      .describe(
        'Search depth: "basic" for quick results, "advanced" for comprehensive research'
      ),

    includeAnswer: z
      .boolean()
      .default(true)
      .describe(
        'Whether to include a direct answer summary from the search provider'
      ),
  }),

  execute: async ({
    query,
    maxResults = 5,
    searchDepth = 'basic' as 'basic' | 'advanced',
    includeAnswer = true,
  }: {
    query: string;
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
  }) => {
    try {
      // ====================================================================
      // OPTION 1: TAVILY (Recommended for AI apps)
      // ====================================================================

      /*
      // Install: pnpm install @tavily/core
      import { tavily } from '@tavily/core';

      const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

      const response = await client.search(query, {
        maxResults,
        searchDepth,
        includeAnswer,
        includeImages: false, // Set to true if you want image results
      });

      // Format results for AI consumption
      const results = response.results.map((result, index) => ({
        position: index + 1,
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score, // Relevance score
      }));

      return {
        success: true,
        query,
        answer: includeAnswer ? response.answer : undefined,
        results,
        totalResults: results.length,
        sources: results.map(r => r.url),
      };
      */

      // ====================================================================
      // OPTION 2: SERPAPI (Google/Bing results)
      // ====================================================================

      /*
      // Install: pnpm install serpapi
      import { getJson } from 'serpapi';

      const response = await getJson({
        engine: 'google',
        q: query,
        api_key: process.env.SERPAPI_API_KEY!,
        num: maxResults,
      });

      const results = response.organic_results.map((result: any, index: number) => ({
        position: index + 1,
        title: result.title,
        url: result.link,
        snippet: result.snippet,
      }));

      return {
        success: true,
        query,
        results,
        totalResults: results.length,
        sources: results.map((r: any) => r.url),
      };
      */

      // ====================================================================
      // OPTION 3: EXA (AI-native search)
      // ====================================================================

      /*
      // Install: pnpm install exa-js
      import Exa from 'exa-js';

      const exa = new Exa(process.env.EXA_API_KEY!);

      const response = await exa.searchAndContents(query, {
        numResults: maxResults,
        text: true,
        highlights: true,
      });

      const results = response.results.map((result, index) => ({
        position: index + 1,
        title: result.title,
        url: result.url,
        snippet: result.text || result.highlights?.[0] || '',
        publishedDate: result.publishedDate,
        author: result.author,
      }));

      return {
        success: true,
        query,
        results,
        totalResults: results.length,
        sources: results.map(r => r.url),
      };
      */

      // ====================================================================
      // OPTION 4: BRAVE SEARCH API (No SDK needed)
      // ====================================================================

      /*
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY!,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Brave API error: ${response.status}`);
      }

      const data = await response.json();

      const results = data.web.results.map((result: any, index: number) => ({
        position: index + 1,
        title: result.title,
        url: result.url,
        snippet: result.description,
      }));

      return {
        success: true,
        query,
        results,
        totalResults: results.length,
        sources: results.map((r: any) => r.url),
      };
      */

      // ====================================================================
      // MOCK IMPLEMENTATION (Replace with above)
      // ====================================================================

      /**
       * This mock implementation shows the expected response format.
       * Replace with one of the real implementations above.
       */

      console.log('[Mock Search] Query:', query);

      // Simulate search results
      const mockResults = [
        {
          position: 1,
          title: 'Example Search Result 1',
          url: 'https://example.com/result1',
          snippet:
            'This is a mock search result snippet that would contain relevant information about the query.',
        },
        {
          position: 2,
          title: 'Example Search Result 2',
          url: 'https://example.com/result2',
          snippet:
            'Another mock result with different information that helps answer the search query.',
        },
        {
          position: 3,
          title: 'Example Search Result 3',
          url: 'https://example.com/result3',
          snippet:
            'A third mock result providing additional context and information.',
        },
      ].slice(0, maxResults);

      return {
        success: true,
        query,
        answer: includeAnswer
          ? 'This is a mock answer summary based on the search results.'
          : undefined,
        results: mockResults,
        totalResults: mockResults.length,
        sources: mockResults.map((r) => r.url),
      };
    } catch (error) {
      // ====================================================================
      // ERROR HANDLING
      // ====================================================================

      console.error('[Tool] searchWeb error:', error);

      // Handle specific error cases
      if (error instanceof Error) {
        // API key missing
        if (error.message.includes('API key') || error.message.includes('auth')) {
          return {
            success: false,
            error:
              'Search API key not configured. Please set TAVILY_API_KEY (or your chosen provider) in environment variables.',
          };
        }

        // Rate limit
        if (error.message.includes('rate limit')) {
          return {
            success: false,
            error: 'Search API rate limit reached. Please try again later.',
          };
        }

        // Network error
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return {
            success: false,
            error: 'Network error while searching. Please check your connection.',
          };
        }
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An error occurred while searching',
      };
    }
  },
});

// ============================================================================
// ADDITIONAL EXAMPLES
// ============================================================================

/**
 * Example: News-specific search
 */
export const searchNews = tool({
  description:
    'Search for recent news articles on a specific topic. Returns latest news with publication dates.',

  inputSchema: z.object({
    query: z.string().describe('The news topic or event to search for'),

    maxResults: z
      .number()
      .min(1)
      .max(20)
      .default(10)
      .describe('Maximum number of news articles to return'),

    language: z
      .string()
      .default('en')
      .describe('Language code (e.g., "en", "es", "fr")'),

    sortBy: z
      .enum(['relevance', 'date'])
      .default('date')
      .describe('Sort by relevance or publication date'),
  }),

  execute: async ({
    query,
    maxResults = 10,
    language = 'en',
    sortBy = 'date' as 'relevance' | 'date',
  }: {
    query: string;
    maxResults?: number;
    language?: string;
    sortBy?: 'relevance' | 'date';
  }) => {
    try {
      // Example with NewsAPI:
      /*
      const response = await fetch(
        `https://newsapi.org/v2/everything?` +
        `q=${encodeURIComponent(query)}&` +
        `pageSize=${maxResults}&` +
        `language=${language}&` +
        `sortBy=${sortBy}`,
        {
          headers: {
            'X-Api-Key': process.env.NEWS_API_KEY!,
          },
        }
      );

      const data = await response.json();

      const articles = data.articles.map((article: any, index: number) => ({
        position: index + 1,
        title: article.title,
        url: article.url,
        snippet: article.description,
        source: article.source.name,
        publishedAt: article.publishedAt,
        author: article.author,
      }));

      return {
        success: true,
        query,
        articles,
        totalResults: data.totalResults,
        sources: articles.map((a: any) => a.url),
      };
      */

      // Mock implementation
      console.log('[Mock] Searching news for:', query);

      return {
        success: true,
        query,
        articles: [
          {
            position: 1,
            title: `Latest news about ${query}`,
            url: 'https://example.com/news1',
            snippet: 'Mock news article description',
            source: 'Example News',
            publishedAt: new Date().toISOString(),
          },
        ],
        totalResults: 1,
      };
    } catch (error) {
      console.error('[Tool] searchNews error:', error);
      return {
        success: false,
        error: 'Failed to search news',
      };
    }
  },
});

/**
 * Example: Image search
 */
export const searchImages = tool({
  description:
    'Search for images on a specific topic. Returns image URLs and metadata.',

  inputSchema: z.object({
    query: z.string().describe('The image search query'),

    maxResults: z
      .number()
      .min(1)
      .max(20)
      .default(10)
      .describe('Maximum number of images to return'),

    imageType: z
      .enum(['photo', 'illustration', 'vector'])
      .optional()
      .describe('Filter by image type'),

    orientation: z
      .enum(['landscape', 'portrait', 'square'])
      .optional()
      .describe('Filter by image orientation'),
  }),

  execute: async ({
    query,
    maxResults = 10,
    imageType,
    orientation,
  }: {
    query: string;
    maxResults?: number;
    imageType?: 'photo' | 'illustration' | 'vector';
    orientation?: 'landscape' | 'portrait' | 'square';
  }) => {
    try {
      // Example with Unsplash API:
      /*
      const response = await fetch(
        `https://api.unsplash.com/search/photos?` +
        `query=${encodeURIComponent(query)}&` +
        `per_page=${maxResults}` +
        (orientation ? `&orientation=${orientation}` : ''),
        {
          headers: {
            'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY!}`,
          },
        }
      );

      const data = await response.json();

      const images = data.results.map((photo: any) => ({
        url: photo.urls.regular,
        thumbnail: photo.urls.thumb,
        description: photo.description || photo.alt_description,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        width: photo.width,
        height: photo.height,
      }));

      return {
        success: true,
        query,
        images,
        totalResults: data.total,
      };
      */

      // Mock implementation
      console.log('[Mock] Searching images for:', query);

      return {
        success: true,
        query,
        images: [
          {
            url: 'https://example.com/image1.jpg',
            thumbnail: 'https://example.com/image1_thumb.jpg',
            description: `Mock image result for ${query}`,
            width: 1920,
            height: 1080,
          },
        ],
        totalResults: 1,
      };
    } catch (error) {
      console.error('[Tool] searchImages error:', error);
      return {
        success: false,
        error: 'Failed to search images',
      };
    }
  },
});

/**
 * Example: Domain-specific search (search within a website)
 */
export const searchDomain = tool({
  description:
    'Search within a specific website or domain. Useful for searching documentation, knowledge bases, or specific sites.',

  inputSchema: z.object({
    query: z.string().describe('The search query'),

    domain: z
      .string()
      .describe('The domain to search within (e.g., "docs.example.com")'),

    maxResults: z.number().min(1).max(20).default(10),
  }),

  execute: async ({
    query,
    domain,
    maxResults = 10,
  }: {
    query: string;
    domain: string;
    maxResults?: number;
  }) => {
    try {
      // Example using Google Custom Search (site: operator):
      /*
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?` +
        `key=${process.env.GOOGLE_API_KEY}&` +
        `cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&` +
        `q=site:${domain} ${encodeURIComponent(query)}&` +
        `num=${maxResults}`
      );

      const data = await response.json();

      const results = data.items?.map((item: any, index: number) => ({
        position: index + 1,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      })) || [];

      return {
        success: true,
        query,
        domain,
        results,
        totalResults: data.searchInformation?.totalResults || 0,
      };
      */

      // Mock implementation
      console.log(`[Mock] Searching ${domain} for:`, query);

      return {
        success: true,
        query,
        domain,
        results: [
          {
            position: 1,
            title: `Result from ${domain}`,
            url: `https://${domain}/result1`,
            snippet: `Mock result from ${domain} about ${query}`,
          },
        ],
        totalResults: 1,
      };
    } catch (error) {
      console.error('[Tool] searchDomain error:', error);
      return {
        success: false,
        error: 'Failed to search domain',
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
 * 1. Choose and install a search provider:
 *
 *    Tavily (recommended):
 *      pnpm install @tavily/core
 *      TAVILY_API_KEY=tvly-...
 *
 *    SerpAPI:
 *      pnpm install serpapi
 *      SERPAPI_API_KEY=...
 *
 *    Exa:
 *      pnpm install exa-js
 *      EXA_API_KEY=...
 *
 *    Brave:
 *      (No install needed, uses fetch)
 *      BRAVE_SEARCH_API_KEY=...
 *
 * 2. Add API key to .env.local
 *
 * 3. Uncomment the implementation for your chosen provider
 *
 * 4. Export the tool from src/lib/ai/tools/index.ts:
 *
 *    import { searchWeb } from './examples/searchCustomAPI';
 *
 *    export const tools = {
 *      searchWeb,
 *      // ... other tools
 *    };
 *
 * 5. Restart dev server
 *
 * 6. Optional: Disable OpenAI built-in search in UI if using custom search
 */

/**
 * Provider Comparison:
 *
 * | Provider | Best For              | Pricing              | Setup   |
 * |----------|-----------------------|----------------------|---------|
 * | Tavily   | AI apps, citations    | $0.005/search        | Easy    |
 * | Exa      | High-quality content  | $10/mo starter       | Easy    |
 * | SerpAPI  | Google/Bing results   | $50/mo (5k searches) | Easy    |
 * | Brave    | Privacy, free tier    | Free tier available  | Easy    |
 * | OpenAI   | Simplicity            | Included in GPT cost | Built-in|
 *
 * Recommendation: Start with Tavily for best AI integration, or stick with
 * OpenAI built-in search if you don't need customization.
 */

/**
 * Response Format Best Practices:
 *
 * Always structure search results similarly:
 * {
 *   success: boolean,
 *   query: string,
 *   answer?: string,           // Direct answer summary (optional)
 *   results: Array<{
 *     position: number,
 *     title: string,
 *     url: string,
 *     snippet: string,
 *     score?: number,          // Relevance score (optional)
 *   }>,
 *   totalResults: number,
 *   sources: string[],         // URLs for citation
 * }
 *
 * This format works well with citation systems and is easy for AI to parse.
 */

/**
 * Performance Optimization:
 *
 * - Cache search results (especially for common queries)
 * - Use shorter timeouts for search requests (10-15s max)
 * - Limit maxResults to avoid large payloads
 * - Implement retry logic for transient failures
 * - Monitor API usage and costs
 * - Consider search result deduplication
 */

/**
 * Citation Integration:
 *
 * If your UI supports citations (like this starter), format results
 * to include source URLs:
 *
 * return {
 *   success: true,
 *   results: [...],
 *   sources: results.map(r => r.url), // For citation tracking
 * };
 *
 * The AI can reference these sources using [1], [2] markers.
 */
