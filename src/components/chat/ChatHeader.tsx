"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";
import { Trash2Icon } from "lucide-react";

export type ChatHeaderProps = ComponentProps<"header"> & {
  title?: string;
  subtitle?: string;
  onClear?: () => void;
  canClear?: boolean;
};

/**
 * Minimal header for the chat screen.
 *
 * Keep this small on purpose: the “power features” (model picker, attachments,
 * action menu) live in `PromptInput` so they stay close to the user’s intent.
 *
 * Later upgrade path:
 * - Add thread selector (for DB persistence)
 * - Add user/profile menu
 * - Add “export conversation” actions
 */
export function ChatHeader({
  className,
  title = "Agent Starter",
  subtitle = "Streaming chat + tools, built with AI Elements",
  onClear,
  canClear = true,
  ...props
}: ChatHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{title}</div>
        <div className="truncate text-muted-foreground text-xs">{subtitle}</div>
      </div>

      {onClear && (
        <Button
          disabled={!canClear}
          onClick={onClear}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2Icon className="mr-2 size-4" />
          Clear
        </Button>
      )}
    </header>
  );
}


