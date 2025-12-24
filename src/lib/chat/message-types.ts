import type { UIMessage } from "ai";

/**
 * Extended UIMessage with additional metadata for chat persistence.
 *
 * These fields are automatically added by the chat API and persisted
 * to storage alongside the standard AI SDK message fields.
 */
export type ExtendedUIMessage = UIMessage & {
  /**
   * Unix timestamp (milliseconds) when the message was created.
   * Added automatically to both user and assistant messages.
   */
  timestamp: number;

  /**
   * The model ID used to generate this message.
   * Only present on assistant messages.
   * Examples: "openai/gpt-4", "anthropic/claude-3-5-sonnet-20241022"
   */
  model?: string;
};

/**
 * Type guard to check if a message has timestamp metadata.
 */
export function hasTimestamp(message: UIMessage): message is UIMessage & { timestamp: number } {
  return typeof (message as { timestamp?: unknown }).timestamp === "number";
}

/**
 * Type guard to check if a message has model metadata.
 */
export function hasModel(message: UIMessage): message is UIMessage & { model: string } {
  return typeof (message as { model?: unknown }).model === "string";
}

/**
 * Format a timestamp for display.
 */
export function formatMessageTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
