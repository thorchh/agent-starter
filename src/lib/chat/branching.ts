import type { UIMessage } from "ai";

/**
 * Branching + inline edit helpers.
 *
 * We store conversation graph edges in `UIMessage.metadata` to stay compatible
 * with AI SDK message shapes and persistence.
 *
 * - Each message points to its parent message via `metadata.parentId`.
 * - Branches are simply multiple children under the same parent.
 */

export const ROOT_PARENT_ID = null as const;
export const ROOT_PARENT_KEY = "__root__" as const;

export type ParentId = string | null;

export type BranchingMetadata = {
  parentId?: ParentId;
  editedFromId?: string;
};

export function parentKeyFromParentId(parentId: ParentId): string {
  return parentId === null ? ROOT_PARENT_KEY : parentId;
}

export function getBranchingMetadata(message: UIMessage): BranchingMetadata {
  const md = (message as UIMessage & { metadata?: unknown }).metadata;
  if (!md || typeof md !== "object") return {};

  const any = md as Record<string, unknown>;
  const parentId =
    typeof any.parentId === "string"
      ? any.parentId
      : any.parentId === null
        ? null
        : undefined;
  const editedFromId =
    typeof any.editedFromId === "string" ? any.editedFromId : undefined;

  return { parentId, editedFromId };
}

export function getParentId(message: UIMessage): ParentId | undefined {
  return getBranchingMetadata(message).parentId;
}

export function getEditedFromId(message: UIMessage): string | undefined {
  return getBranchingMetadata(message).editedFromId;
}

export function withBranchingMetadata(
  message: UIMessage,
  next: BranchingMetadata
): UIMessage {
  const currentMeta =
    (message as UIMessage & { metadata?: unknown }).metadata &&
    typeof (message as UIMessage & { metadata?: unknown }).metadata === "object"
      ? ((message as UIMessage & { metadata?: unknown }).metadata as Record<
          string,
          unknown
        >)
      : {};

  return {
    ...message,
    metadata: {
      ...currentMeta,
      ...next,
    },
  };
}

export type ChildrenByParentKey = Map<string, UIMessage[]>;

export function buildChildrenByParentKey(messages: UIMessage[]): ChildrenByParentKey {
  const map: ChildrenByParentKey = new Map();
  for (const m of messages) {
    const parentId = getParentId(m) ?? ROOT_PARENT_ID;
    const key = parentKeyFromParentId(parentId);
    const existing = map.get(key);
    if (existing) {
      existing.push(m);
    } else {
      map.set(key, [m]);
    }
  }
  return map;
}

export type BranchSelectionByParentKey = Record<string, number | undefined>;

export function getSelectedChildIndex(
  selection: BranchSelectionByParentKey | undefined,
  parentKey: string,
  childCount: number
): number {
  if (childCount <= 0) return 0;
  const raw = selection?.[parentKey];
  const idx = typeof raw === "number" && Number.isFinite(raw) ? raw : childCount - 1;
  return Math.max(0, Math.min(childCount - 1, idx));
}

export function deriveVisiblePath(
  messages: UIMessage[],
  selection?: BranchSelectionByParentKey
): UIMessage[] {
  const childrenByParentKey = buildChildrenByParentKey(messages);
  const out: UIMessage[] = [];

  let parentKey: string = ROOT_PARENT_KEY;
  // Prevent accidental infinite loops from corrupt data.
  const seen = new Set<string>();

  while (true) {
    const children = childrenByParentKey.get(parentKey);
    if (!children || children.length === 0) break;

    const idx = getSelectedChildIndex(selection, parentKey, children.length);
    const next = children[idx];
    if (!next) break;

    if (seen.has(next.id)) break;
    seen.add(next.id);

    out.push(next);
    parentKey = next.id;
  }

  return out;
}

export function getSiblingsForMessage(
  messages: UIMessage[],
  message: UIMessage
): { parentKey: string; siblings: UIMessage[]; index: number } {
  const parentId = getParentId(message) ?? ROOT_PARENT_ID;
  const parentKey = parentKeyFromParentId(parentId);
  const siblings = buildChildrenByParentKey(messages).get(parentKey) ?? [message];
  const index = Math.max(0, siblings.findIndex((m) => m.id === message.id));
  return { parentKey, siblings, index };
}

export function mergeMessagesById(
  base: UIMessage[],
  incoming: UIMessage[]
): UIMessage[] {
  // Keep order stable: base order first, then any new incoming IDs appended.
  const byId = new Map<string, UIMessage>();
  for (const m of base) {
    if (m?.id) byId.set(m.id, m);
  }
  for (const m of incoming) {
    if (m?.id) byId.set(m.id, m);
  }

  const out: UIMessage[] = [];
  const seen = new Set<string>();

  for (const m of base) {
    const next = m?.id ? byId.get(m.id) : undefined;
    if (next && !seen.has(next.id)) {
      out.push(next);
      seen.add(next.id);
    }
  }
  for (const m of incoming) {
    const next = m?.id ? byId.get(m.id) : undefined;
    if (next && !seen.has(next.id)) {
      out.push(next);
      seen.add(next.id);
    }
  }

  return out;
}


