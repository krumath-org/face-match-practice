/**
 * Collections ("decks") are what keep one subject from leaking into another: without
 * them a vocabulary picture could appear as a distractor for a person's name.
 *
 * A collection is just a free-text name stored on each item row rather than its own
 * table. A name is all this app needs, and deriving the list from the items avoids a
 * second table, a foreign key, and a second set of RLS policies to keep in step.
 */

/**
 * Where items land when nothing else is known. This is also what the `collection`
 * column defaults to, so accounts created before collections existed already have
 * their rows in a deck with this name.
 */
export const DEFAULT_COLLECTION = "People";

/** Remembers the deck the user looked at last, so a reload lands in the same one. */
export const COLLECTION_STORAGE_KEY = "krumemory.collection";

export type CollectionSummary = {
  name: string;
  itemCount: number;
};

/** Trim, and collapse inner runs of whitespace so "French  words" equals "French words". */
export function normalizeCollectionName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * The stored spelling of the deck that matches `raw`, ignoring case, or null when the
 * user typed a genuinely new name. Returning the existing spelling is what stops
 * "french" from creating a second deck beside "French".
 */
export function matchCollectionName(existing: readonly string[], raw: string): string | null {
  const wanted = normalizeCollectionName(raw).toLocaleLowerCase();
  if (wanted === "") return null;
  return existing.find((name) => name.toLocaleLowerCase() === wanted) ?? null;
}

/**
 * Decks in first-seen order. Items arrive ordered by `created_at`, so this is the order
 * the user's decks were created in — stable, and it keeps the legacy "People" deck first
 * for accounts that predate collections.
 */
export function collectionsFromItems(
  items: readonly { collection: string }[],
): CollectionSummary[] {
  const byName = new Map<string, CollectionSummary>();
  for (const item of items) {
    const name = normalizeCollectionName(item.collection);
    const existing = byName.get(name);
    if (existing) existing.itemCount += 1;
    else byName.set(name, { name, itemCount: 1 });
  }
  return [...byName.values()];
}

export function collectionNames(collections: readonly CollectionSummary[]): string[] {
  return collections.map((collection) => collection.name);
}

export function readStoredCollection(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (stored === null) return null;
    return normalizeCollectionName(stored) || null;
  } catch {
    // Private mode or blocked storage; fall back to the first deck.
    return null;
  }
}

export function writeStoredCollection(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLLECTION_STORAGE_KEY, name);
  } catch {
    // Persisting is best-effort; the session still switches decks.
  }
}

/**
 * Which deck to show: the remembered one when it still exists, otherwise the first
 * deck, otherwise null — a brand-new account with no items at all. Matching the stored
 * name case-insensitively means a deck the user retyped as "French" still resolves.
 */
export function resolveCollectionName(
  available: readonly string[],
  remembered: string | null,
): string | null {
  if (remembered !== null) {
    const wanted = remembered.toLocaleLowerCase();
    const match = available.find((name) => name.toLocaleLowerCase() === wanted);
    if (match !== undefined) return match;
  }
  return available[0] ?? null;
}
