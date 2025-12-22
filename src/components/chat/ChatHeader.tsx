"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";
import { PlusIcon } from "lucide-react";

export type ChatHeaderProps = ComponentProps<"header"> & {
  title?: string;
  subtitle?: string;
  onNewChat?: () => void;
  canNewChat?: boolean;
  actions?: ReactNode;
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
  subtitle = "AI Elements • Streaming • Tool Calling",
  onNewChat,
  canNewChat = true,
  actions,
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
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="truncate font-semibold text-sm tracking-tight">{title}</div>
        <div className="truncate text-muted-foreground text-[11px] font-medium tracking-wide uppercase opacity-80">{subtitle}</div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        {actions}
        {onNewChat && (
          <Button
            disabled={!canNewChat}
            onClick={onNewChat}
            size="sm"
            type="button"
            variant="ghost"
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <PlusIcon className="mr-1.5 size-3.5" />
            <span className="text-xs font-medium">New chat</span>
          </Button>
        )}
      </div>
    </header>
  );
}


