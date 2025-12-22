"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon, PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function ChatSidebar(props: {
  activeChatId: string;
  className?: string;
}) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ chats: ChatSummary[] }>("/api/chats");
      setChats(data.chats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, filter]);

  const createNewChat = async () => {
    setError(null);
    try {
      const data = await fetchJson<{ id: string }>("/api/chats", { method: "POST" });
      router.push(`/chat/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create chat");
    }
  };

  const deleteOne = async (id: string) => {
    const ok = window.confirm("Delete this chat? This cannot be undone.");
    if (!ok) return;
    setError(null);
    try {
      await fetchJson<{ ok: true }>(`/api/chats/${id}`, { method: "DELETE" });
      await refresh();
      if (id === props.activeChatId) {
        // If we deleted the active chat, immediately create a new one.
        await createNewChat();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete chat");
    }
  };

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] flex-col border-r bg-muted/10",
        props.className
      )}
    >
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="text-sm font-semibold tracking-tight text-foreground/70">
          Chats
        </div>
        <Button
          onClick={createNewChat}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="New Chat"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground/70" />
          <input
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:ring-1 focus:ring-ring transition-all"
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        {error && (
          <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-xs text-muted-foreground/50 gap-2">
            <div className="size-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span>Loading chats...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <SearchIcon className="size-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">No chats found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((c) => {
              const active = c.id === props.activeChatId;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <button
                    className="min-w-0 flex-1 text-left outline-none"
                    onClick={() => router.push(`/chat/${c.id}`)}
                    type="button"
                  >
                    <div className={cn("truncate text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                      {c.title}
                    </div>
                    <div className="truncate text-[10px] opacity-60 mt-0.5">
                      {new Date(c.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                      })}
                    </div>
                  </button>

                  <Button
                    aria-label="Delete chat"
                    className={cn(
                      "absolute right-2 h-7 w-7 p-0 opacity-0 transition-all group-hover:opacity-100",
                      active ? "text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted hover:text-destructive"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOne(c.id);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}


