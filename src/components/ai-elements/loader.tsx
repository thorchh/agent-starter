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
    <div className="flex items-center gap-1.5">
      <span
        className="size-2 rounded-full bg-muted-foreground/40 animate-pulse"
        style={{ animationDelay: "0ms", animationDuration: "1s" }}
      />
      <span
        className="size-2 rounded-full bg-muted-foreground/40 animate-pulse"
        style={{ animationDelay: "200ms", animationDuration: "1s" }}
      />
      <span
        className="size-2 rounded-full bg-muted-foreground/40 animate-pulse"
        style={{ animationDelay: "400ms", animationDuration: "1s" }}
      />
    </div>
  </div>
);
