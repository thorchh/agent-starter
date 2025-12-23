"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon, PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Refresh when active chat changes (e.g., new chat created)
  useEffect(() => {
    if (props.activeChatId) {
      refresh();
    }
  }, [props.activeChatId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, filter]);

  const groupedChats = useMemo(() => {
    const groups: Record<string, ChatSummary[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      "Previous 30 Days": [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    filtered.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      if (chatDate >= today) {
        groups.Today.push(chat);
      } else if (chatDate >= yesterday) {
        groups.Yesterday.push(chat);
      } else if (chatDate >= last7Days) {
        groups["Previous 7 Days"].push(chat);
      } else if (chatDate >= last30Days) {
        groups["Previous 30 Days"].push(chat);
      } else {
        groups.Older.push(chat);
      }
    });

    return groups;
  }, [filtered]);

  const createNewChat = async () => {
    // Draft mode: don’t create a chat record until the user submits their first message.
    router.push("/chat");
  };

  const deleteOne = async (id: string) => {
    const ok = window.confirm("Delete this chat? This cannot be undone.");
    if (!ok) return;
    setError(null);
    try {
      await fetchJson<{ ok: true }>(`/api/chats/${id}`, { method: "DELETE" });
      await refresh();
      if (id === props.activeChatId) {
        // If we deleted the active chat, return to draft mode.
        router.push("/chat");
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
          <div className="flex flex-col gap-2 px-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg px-2 py-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 opacity-50" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <SearchIcon className="size-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">No chats found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedChats).map(([label, group]) => {
              if (group.length === 0) return null;
              return (
                <div key={label} className="flex flex-col gap-1">
                  <div className="px-3 text-xs font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">
                    {label}
                  </div>
                  {group.map((c) => {
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
                          <div
                            className={cn(
                              "truncate text-sm font-medium transition-all duration-200 ease-in-out group-hover:pr-8",
                              active ? "text-primary" : "text-foreground"
                            )}
                          >
                            {c.title}
                          </div>
                        </button>

                        <Button
                          aria-label="Delete chat"
                          className={cn(
                            "absolute right-2 h-7 w-7 p-0 opacity-0 transition-all group-hover:opacity-100",
                            active
                              ? "text-primary hover:bg-primary/20"
                              : "text-muted-foreground hover:bg-muted hover:text-destructive"
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
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
