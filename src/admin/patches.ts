/**
 * Edits to code-defined data (courses, faculty, gallery) are stored as patches over the base data,
 * not as copies. That keeps asset URLs (which change on every build) out of browser storage.
 */
export type Patches<T extends { id: string }> = { edits: Record<string, Partial<T>>; added: T[]; removed: string[]; order?: string[] };

export const emptyPatches = <T extends { id: string }>(): Patches<T> => ({ edits: {}, added: [], removed: [] });

export function resolvePatches<T extends { id: string }>(base: T[], p: Patches<T>): T[] {
  const removed = new Set(p.removed);
  const list = [...base, ...p.added].filter((x) => !removed.has(x.id)).map((x) => ({ ...x, ...(p.edits[x.id] ?? {}) }) as T);
  if (!p.order?.length) return list;
  const idx = new Map(p.order.map((id, i) => [id, i]));
  return [...list].sort((a, b) => (idx.get(a.id) ?? 1e9) - (idx.get(b.id) ?? 1e9));
}

/** Upsert: edits an existing item or adds a new one. */
export function upsert<T extends { id: string }>(p: Patches<T>, base: T[], item: T): Patches<T> {
  const isBase = base.some((b) => b.id === item.id);
  if (isBase) return { ...p, edits: { ...p.edits, [item.id]: item } };
  const exists = p.added.some((a) => a.id === item.id);
  return { ...p, added: exists ? p.added.map((a) => (a.id === item.id ? item : a)) : [...p.added, item] };
}

export function remove<T extends { id: string }>(p: Patches<T>, id: string): Patches<T> {
  return { ...p, added: p.added.filter((a) => a.id !== id), removed: p.removed.includes(id) ? p.removed : [...p.removed, id] };
}
