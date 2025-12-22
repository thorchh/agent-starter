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
        "flex h-screen w-[280px] flex-col border-r bg-background",
        props.className
      )}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="text-sm font-semibold tracking-tight">Chats</div>
        <Button onClick={createNewChat} size="sm" className="h-8 gap-1">
          <PlusIcon className="size-4" />
          New
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5">
          <SearchIcon className="size-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search chats…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-3">
        {error && (
          <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No chats yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((c) => {
              const active = c.id === props.activeChatId;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-2",
                    active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/60"
                  )}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => router.push(`/chat/${c.id}`)}
                    type="button"
                  >
                    <div className="truncate text-sm font-medium">{c.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {new Date(c.updatedAt).toLocaleString()}
                    </div>
                  </button>

                  <Button
                    aria-label="Delete chat"
                    className={cn(
                      "h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100",
                      active && "opacity-100"
                    )}
                    onClick={() => deleteOne(c.id)}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon className="size-4" />
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


