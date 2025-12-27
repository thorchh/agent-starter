"use client";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FileUIPart, UIMessage } from "ai";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";
import { Children, createContext, memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";

// ---- Message layout ----
export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

// ---- Message content ----
export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      // No entrance animation: branch switching remounts message content and any animation replays,
      // which feels distracting. Keep this fully static.
      "flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm leading-relaxed shadow-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-2xl group-[.is-user]:bg-muted group-[.is-user]:text-foreground group-[.is-user]:px-4 group-[.is-user]:py-2.5 group-[.is-user]:shadow-none",
      "group-[.is-assistant]:w-full group-[.is-assistant]:px-0 group-[.is-assistant]:py-2 group-[.is-assistant]:text-foreground group-[.is-assistant]:shadow-none",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ---- Message actions ----
export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

// ---- Message action ----
export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

// ---- Message branch internals ----
type MessageBranchContextType = {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
};

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
);

// ---- Message branch hook ----
const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

// ---- Message branch wrapper ----
export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  };

  const goToPrevious = () => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const goToNext = () => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue: MessageBranchContextType = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  };

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

// ---- Message branch content ----
export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = Array.isArray(children) ? children : [children];

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

// ---- Message branch selector ----
export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const MessageBranchSelector = ({
  className,
  from,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className="[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md"
      orientation="horizontal"
      {...props}
    />
  );
};

// ---- Message branch previous ----
export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

// ---- Message branch next ----
export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  className,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

// ---- Message branch page ----
export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

// ---- Message response ----
export type MessageResponseProps = ComponentProps<typeof Streamdown>;

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MessageResponse.displayName = "MessageResponse";

// ---- Message attachment ----
export type MessageAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart;
  className?: string;
  onRemove?: () => void;
};

export function MessageAttachment({
  data,
  className,
  onRemove,
  ...props
}: MessageAttachmentProps) {
  const filename = data.filename || "";
  const mediaType = data.mediaType || "";

  // Some models (e.g. Nano Banana Pro) expose image bytes as `uint8Array` in `files`.
  // When streamed into UI messages, we may receive a `file` part without a usable URL.
  // In that case, create a blob URL client-side for rendering.
  const uint8Array = (data as unknown as { uint8Array?: Uint8Array }).uint8Array;
  const blobUrl = useMemo(() => {
    if (!uint8Array) return null;
    if (!mediaType.startsWith("image/")) return null;
    try {
      // Ensure the underlying buffer is an ArrayBuffer (not SharedArrayBuffer) for TS/DOM typings.
      const bytes = Uint8Array.from(uint8Array);
      const blob = new Blob([bytes], { type: mediaType });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [mediaType, uint8Array]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const imageUrl = data.url || blobUrl || null;
  const isImage = mediaType.startsWith("image/") && Boolean(imageUrl);
  const attachmentLabel = filename || (isImage ? "Image" : "Attachment");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group relative size-24 overflow-hidden rounded-lg",
          className
        )}
        {...props}
      >
        {isImage ? (
          <>
            <button
              type="button"
              className="block size-full cursor-zoom-in"
              onClick={() => setOpen(true)}
              aria-label="Open image"
            >
              <img
                alt={filename || "attachment"}
                className="size-full object-cover"
                height={100}
                src={imageUrl ?? undefined}
                width={100}
              />
            </button>
            {onRemove && (
              <Button
                aria-label="Remove attachment"
                className="absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 [&>svg]:size-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                type="button"
                variant="ghost"
              >
                <XIcon />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <PaperclipIcon className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{attachmentLabel}</p>
              </TooltipContent>
            </Tooltip>
            {onRemove && (
              <Button
                aria-label="Remove attachment"
                className="size-6 shrink-0 rounded-full p-0 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 [&>svg]:size-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                type="button"
                variant="ghost"
              >
                <XIcon />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </>
        )}
      </div>

      {isImage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[96vw] max-w-[min(96vw,1200px)] sm:max-w-[min(96vw,1400px)]">
            <DialogHeader>
              <DialogTitle className="truncate">{attachmentLabel}</DialogTitle>
            </DialogHeader>
            <div className="flex max-h-[82vh] items-center justify-center overflow-hidden rounded-xl bg-muted/30">
              <img
                alt={attachmentLabel}
                src={imageUrl ?? undefined}
                className="max-h-[82vh] w-auto max-w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ---- Message attachments ----
export type MessageAttachmentsProps = ComponentProps<"div">;

export function MessageAttachments({
  children,
  className,
  ...props
}: MessageAttachmentsProps) {
  const items = Children.toArray(children).filter(Boolean);
  const [showAll, setShowAll] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const MAX_VISIBLE = 3;

  useEffect(() => {
    if (showAll && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [showAll]);

  if (!items.length) {
    return null;
  }

  const hasMore = items.length > MAX_VISIBLE;
  const visibleItems = hasMore ? items.slice(0, MAX_VISIBLE) : items;
  const remainingCount = Math.max(0, items.length - MAX_VISIBLE);

  return (
    <>
      <div
        className={cn(
          "ml-auto flex w-fit max-w-full flex-nowrap items-start gap-2 overflow-x-auto",
          className
        )}
        {...props}
      >
        {visibleItems}
        {hasMore && (
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setShowAll(!showAll)}
            aria-label={`Show ${remainingCount} more attachments`}
            className="flex size-24 items-center justify-center rounded-lg border border-dashed text-sm font-medium text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors"
          >
            +{remainingCount}
          </button>
        )}
      </div>

      {showAll && hasMore && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowAll(false)}
          />
          <div
            className="fixed z-50 min-w-[280px] max-w-md rounded-xl border bg-popover p-3 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">
                All attachments ({items.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                aria-label="Close attachments"
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
              {items}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ---- Message toolbar ----
export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
