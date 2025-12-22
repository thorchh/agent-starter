/**
 * Example Tool: External API Call (Send Email)
 *
 * This template shows how to create a tool that calls external APIs.
 *
 * USAGE:
 * 1. Choose an email provider (Resend, SendGrid, Mailgun, etc.)
 * 2. Install the SDK: pnpm install resend
 * 3. Add API key to .env.local: RESEND_API_KEY=re_...
 * 4. Update the implementation below
 * 5. Export this tool from `src/lib/ai/tools/index.ts`
 * 6. Restart the dev server
 *
 * The AI will automatically use this tool when users ask to send emails.
 */

import { tool } from 'ai';
import { z } from 'zod/v3';

// ============================================================================
// API CLIENT SETUP
// ============================================================================

/**
 * Replace this mock client with your actual email provider SDK.
 *
 * Examples:
 *
 * Resend (recommended):
 *   import { Resend } from 'resend';
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *
 * SendGrid:
 *   import sgMail from '@sendgrid/mail';
 *   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
 *
 * Mailgun:
 *   import formData from 'form-data';
 *   import Mailgun from 'mailgun.js';
 *   const mailgun = new Mailgun(formData);
 *   const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY!});
 *
 * Postmark:
 *   import { ServerClient } from 'postmark';
 *   const client = new ServerClient(process.env.POSTMARK_API_KEY!);
 */

// Mock email client for demonstration
const mockEmailClient = {
  send: async (params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }) => {
    console.log('[Mock Email] Would send:', params);
    return {
      id: `mock_${Date.now()}`,
      success: true,
    };
  },
};

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export const sendEmail = tool({
  /**
   * Description: Tells the AI when to use this tool.
   *
   * Be specific about:
   * - What this tool does
   * - When it should be used
   * - Any restrictions or requirements
   */
  description:
    'Send a transactional email to a user. Use this for order confirmations, password resets, notifications, or direct user communication. Always get user consent before sending.',

  /**
   * Parameters: Zod schema for type-safe input validation.
   *
   * Email-specific validations:
   * - Use .email() for email validation
   * - Use .min()/.max() for length limits
   * - Use .optional() for optional fields
   * - Use .describe() to guide the AI
   */
  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),

    subject: z
      .string()
      .min(1)
      .max(200)
      .describe('Email subject line (1-200 characters)'),

    message: z
      .string()
      .min(1)
      .describe('Email body content (plain text or HTML)'),

    isHtml: z
      .boolean()
      .default(false)
      .describe('Whether the message contains HTML (default: false)'),

    from: z
      .string()
      .email()
      .optional()
      .describe('Sender email address (uses default if not provided)'),
  }),

  /**
   * Execute: The async function that calls the external API.
   *
   * Best practices:
   * - Validate environment variables
   * - Use try/catch for network errors
   * - Implement retry logic for transient failures
   * - Return structured success/error responses
   * - Log API calls for debugging
   * - Handle rate limits gracefully
   */
  execute: async ({ to, subject, message, isHtml = false, from }) => {
    try {
      // ====================================================================
      // ENVIRONMENT VALIDATION
      // ====================================================================

      /**
       * Always check that required API keys are configured.
       * Provide helpful error messages if they're missing.
       */

      if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
        return {
          success: false,
          error:
            'Email service not configured. Please set RESEND_API_KEY or SENDGRID_API_KEY environment variable.',
        };
      }

      // ====================================================================
      // INPUT SANITIZATION
      // ====================================================================

      /**
       * Sanitize inputs to prevent injection attacks.
       * Even though Zod validates types, you should sanitize content.
       */

      // For HTML emails, you might want to:
      // import { escape } from 'html-escaper';
      // const sanitizedMessage = isHtml ? sanitizeHtml(message) : escape(message);

      // ====================================================================
      // API CALL WITH ERROR HANDLING
      // ====================================================================

      // Example with Resend:
      /*
      import { Resend } from 'resend';
      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: from || 'noreply@yourdomain.com',
        to,
        subject,
        [isHtml ? 'html' : 'text']: message,
      });

      if (result.error) {
        console.error('[Tool] sendEmail error:', result.error);
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data.id,
        message: `Email sent successfully to ${to}`,
      };
      */

      // Example with SendGrid:
      /*
      import sgMail from '@sendgrid/mail';
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      await sgMail.send({
        to,
        from: from || 'noreply@yourdomain.com',
        subject,
        [isHtml ? 'html' : 'text']: message,
      });

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
      };
      */

      // Mock implementation (replace with above)
      const result = await mockEmailClient.send({
        to,
        subject,
        [isHtml ? 'html' : 'text']: message,
      });

      return {
        success: true,
        messageId: result.id,
        message: `Email "${subject}" sent successfully to ${to}`,
      };
    } catch (error) {
      // ====================================================================
      // ERROR HANDLING WITH RETRY LOGIC
      // ====================================================================

      /**
       * Handle different error types appropriately:
       * - Network errors: might retry
       * - Rate limits: inform user to wait
       * - Invalid API key: configuration error
       * - Invalid recipient: validation error
       */

      console.error('[Tool] sendEmail error:', error);

      // Check for specific error types
      if (error instanceof Error) {
        // Rate limit error (HTTP 429)
        if (error.message.includes('rate limit')) {
          return {
            success: false,
            error: 'Email service rate limit reached. Please try again later.',
          };
        }

        // Invalid recipient
        if (error.message.includes('invalid') && error.message.includes('email')) {
          return {
            success: false,
            error: `Invalid email address: ${to}`,
          };
        }

        // Network error (might retry)
        if (error.message.includes('network') || error.message.includes('timeout')) {
          // Implement retry logic here
          return {
            success: false,
            error: 'Network error. Please try again.',
          };
        }
      }

      // Generic error
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send email due to an unexpected error',
      };
    }
  },
});

// ============================================================================
// ADDITIONAL EXAMPLES
// ============================================================================

/**
 * Example: Send templated email
 */
export const sendTemplatedEmail = tool({
  description:
    'Send a pre-designed email template (order confirmation, password reset, etc.) to a user.',

  inputSchema: z.object({
    to: z.string().email().describe('Recipient email address'),

    template: z
      .enum(['order_confirmation', 'password_reset', 'welcome'])
      .describe('Email template to use'),

    variables: z
      .record(z.string())
      .describe(
        'Template variables as key-value pairs (e.g., {orderNumber: "12345", customerName: "Alice"})'
      ),
  }),

  execute: async ({ to, template, variables }) => {
    try {
      // Example with Resend React Email:
      /*
      import { OrderConfirmationEmail } from '@/emails/OrderConfirmation';

      const result = await resend.emails.send({
        from: 'orders@yourdomain.com',
        to,
        subject: 'Order Confirmation',
        react: OrderConfirmationEmail(variables),
      });

      return {
        success: true,
        messageId: result.data.id,
      };
      */

      // Mock implementation
      console.log(`[Mock] Sending ${template} template to ${to}`, variables);

      return {
        success: true,
        message: `${template} email sent to ${to}`,
      };
    } catch (error) {
      console.error('[Tool] sendTemplatedEmail error:', error);
      return {
        success: false,
        error: 'Failed to send templated email',
      };
    }
  },
});

/**
 * Example: Send bulk emails (use with caution!)
 */
export const sendBulkEmail = tool({
  description:
    'Send the same email to multiple recipients. WARNING: Use only for legitimate notifications, never for spam.',

  inputSchema: z.object({
    recipients: z
      .array(z.string().email())
      .min(1)
      .max(50)
      .describe('Array of recipient email addresses (max 50)'),

    subject: z.string().describe('Email subject line'),

    message: z.string().describe('Email body content'),

    isHtml: z.boolean().default(false),
  }),

  execute: async ({ recipients, subject, message, isHtml = false }) => {
    try {
      // Validate recipient count
      if (recipients.length > 50) {
        return {
          success: false,
          error: 'Cannot send to more than 50 recipients at once',
        };
      }

      // Example: Send individual emails (better for personalization)
      /*
      const results = await Promise.allSettled(
        recipients.map(to =>
          resend.emails.send({
            from: 'noreply@yourdomain.com',
            to,
            subject,
            [isHtml ? 'html' : 'text']: message,
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        sent: successful,
        failed,
        message: `Sent ${successful} emails, ${failed} failed`,
      };
      */

      // Mock implementation
      console.log(`[Mock] Sending bulk email to ${recipients.length} recipients`);

      return {
        success: true,
        sent: recipients.length,
        failed: 0,
        message: `Email sent to ${recipients.length} recipients`,
      };
    } catch (error) {
      console.error('[Tool] sendBulkEmail error:', error);
      return {
        success: false,
        error: 'Failed to send bulk emails',
      };
    }
  },
});

/**
 * Example: Generic external API call
 */
export const callExternalAPI = tool({
  description:
    'Make a generic HTTP request to an external API (for integrations like CRMs, payment processors, shipping providers, etc.)',

  inputSchema: z.object({
    url: z.string().url().describe('API endpoint URL'),

    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
      .default('GET')
      .describe('HTTP method'),

    body: z
      .record(z.unknown())
      .optional()
      .describe('Request body (for POST/PUT/PATCH)'),

    headers: z
      .record(z.string())
      .optional()
      .describe('Custom HTTP headers'),
  }),

  execute: async ({ url, method = 'GET', body, headers = {} }) => {
    try {
      // Set timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          success: false,
          error: `API returned ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const data = await response.json();

      return {
        success: true,
        data,
        statusCode: response.status,
      };
    } catch (error) {
      console.error('[Tool] callExternalAPI error:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout after 15 seconds',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed',
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
 * 1. Install email provider SDK:
 *    pnpm install resend
 *
 * 2. Add API key to .env.local:
 *    RESEND_API_KEY=re_...
 *
 * 3. Export desired tools from src/lib/ai/tools/index.ts:
 *
 *    import { sendEmail, sendTemplatedEmail } from './examples/sendEmail';
 *
 *    export const tools = {
 *      sendEmail,
 *      sendTemplatedEmail,
 *      // ... other tools
 *    };
 *
 * 4. Restart dev server
 */

/**
 * Security considerations:
 *
 * - Always validate recipient emails
 * - Never expose API keys in responses
 * - Rate limit email sending (prevent abuse)
 * - Sanitize HTML content (prevent XSS)
 * - Get user consent before sending
 * - Add unsubscribe links for marketing emails
 * - Comply with GDPR/CAN-SPAM regulations
 * - Log all email sends for audit
 */

/**
 * Error handling best practices:
 *
 * - Implement exponential backoff for retries
 * - Handle rate limits gracefully
 * - Provide clear error messages to users
 * - Log errors but don't expose sensitive data
 * - Consider dead letter queue for failed sends
 * - Monitor delivery rates and bounces
 */

/**
 * Performance tips:
 *
 * - Use bulk sending APIs when available
 * - Queue emails for async processing
 * - Cache email templates
 * - Use connection pooling
 * - Set appropriate timeouts
 * - Monitor API usage and costs
 */
