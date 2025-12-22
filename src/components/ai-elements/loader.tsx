"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type LoaderProps = HTMLAttributes<HTMLDivElement>;

export const Loader = ({ className, ...props }: LoaderProps) => (
  <div
    className={cn(
      "flex items-center gap-1.5 px-4 py-3",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-1">
      <span
        className="size-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "0ms", animationDuration: "600ms" }}
      />
      <span
        className="size-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "150ms", animationDuration: "600ms" }}
      />
      <span
        className="size-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "300ms", animationDuration: "600ms" }}
      />
    </div>
    <span className="text-xs text-muted-foreground/70 font-medium ml-2">
      Thinking...
    </span>
  </div>
);
