import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth, DEV_AUTH_BYPASS, DEV_BYPASS_USER_ID } from "@/lib/auth/context";
import {
  collectionNames,
  collectionsFromItems,
  DEFAULT_COLLECTION,
  normalizeCollectionName,
  readStoredCollection,
  resolveCollectionName,
  writeStoredCollection,
} from "@/lib/collections";
import {
  clearLegacyStorage,
  deleteItemRow,
  fetchItems,
  insertItem,
  readLegacyItems,
  resetCounts,
  summarise,
  updateAnswerCounts,
  uploadItemPhoto,
  type Item,
} from "@/lib/items-store";

/**
 * Records that this browser has already handed its old data to a KruMath account. The
 * `kruface` prefix is kept on purpose: it is a local storage key, and changing it would
 * make browsers that already imported their data import it a second time.
 */
const IMPORT_MARKER_KEY = "kruface.legacy-import.v1";

function alreadyImported(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(IMPORT_MARKER_KEY) === userId;
  } catch {
    return true;
  }
}

function markImported(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(IMPORT_MARKER_KEY, userId);
  } catch {
    // Worst case the next visit re-runs the import, which is idempotent per file.
  }
}

function describe(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String(error["message"]);
  return String(error);
}

/** Thrown when localhost bypass is pretending to be signed in — Supabase RLS will refuse. */
export class AuthBypassPersistError extends Error {
  constructor() {
    super("AUTH_BYPASS");
    this.name = "AuthBypassPersistError";
  }
}

function assertRealUser(userId: string | null): asserts userId is string {
  if (!userId) throw new AuthBypassPersistError();
  if (DEV_AUTH_BYPASS || userId === DEV_BYPASS_USER_ID) throw new AuthBypassPersistError();
}

export function useItems() {
  const { userId } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The deck in view. Null only while the list is still arriving. */
  const [collection, setCollection] = useState<string | null>(null);
  const [selectionResolved, setSelectionResolved] = useState(false);

  // Mirrors state so async callbacks never read a stale list.
  const itemsRef = useRef<Item[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    void (async () => {
      setLoaded(false);
      try {
        await importLegacyData(userId);
        if (cancelled) return;
        const fetched = await fetchItems();
        if (cancelled) return;
        setItems(fetched);
        // The remembered deck can only be validated against the list that just
        // arrived, and localStorage cannot be read during render without breaking
        // hydration, so the pick settles here rather than in useState.
        setCollection((current) =>
          resolveCollectionName(
            collectionNames(collectionsFromItems(fetched)),
            current ?? readStoredCollection(),
          ),
        );
        setError(null);
      } catch (err) {
        if (!cancelled) setError(describe(err));
      } finally {
        if (!cancelled) {
          setLoaded(true);
          setSelectionResolved(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const collections = useMemo(() => collectionsFromItems(items), [items]);

  const visibleItems = useMemo(
    () =>
      collection === null
        ? []
        : items.filter((item) => normalizeCollectionName(item.collection) === collection),
    [items, collection],
  );

  /** Stats cover the deck in view, so one subject's accuracy never mixes with another. */
  const stats = useMemo(() => summarise(visibleItems), [visibleItems]);

  const selectCollection = useCallback((name: string) => {
    const normalized = normalizeCollectionName(name);
    if (normalized === "") return;
    setCollection(normalized);
    writeStoredCollection(normalized);
  }, []);

  /**
   * Uploads the picture, saves the row, then switches to the deck it went into — so
   * adding the first item of a new deck does not leave the user looking at the old one.
   */
  const addItem = useCallback(
    async (name: string, photo: string | Blob, collectionName: string) => {
      assertRealUser(userId);
      const target = normalizeCollectionName(collectionName) || DEFAULT_COLLECTION;
      const photoPath = await uploadItemPhoto(userId, photo);
      const created = await insertItem({
        userId,
        collection: target,
        name: name.trim(),
        photoPath,
      });
      setItems((prev) => [...prev, created]);
      setCollection(target);
      writeStoredCollection(target);
    },
    [userId],
  );

  /**
   * Saves many cards into one deck with limited concurrency. Failed indexes are returned
   * so the UI can keep those rows in the review queue; successes are already in state.
   */
  const addItems = useCallback(
    async (
      entries: readonly { name: string; photo: string | Blob }[],
      collectionName: string,
      onProgress?: (done: number, total: number) => void,
    ): Promise<{ failedIndexes: number[] }> => {
      if (entries.length === 0) return { failedIndexes: [] };
      assertRealUser(userId);

      const target = normalizeCollectionName(collectionName) || DEFAULT_COLLECTION;
      const failedIndexes: number[] = [];
      let cursor = 0;
      let done = 0;
      const total = entries.length;
      const concurrency = Math.min(3, total);

      const worker = async () => {
        while (true) {
          const index = cursor;
          cursor += 1;
          if (index >= total) return;
          const entry = entries[index]!;
          try {
            const photoPath = await uploadItemPhoto(userId, entry.photo);
            const created = await insertItem({
              userId,
              collection: target,
              name: entry.name.trim(),
              photoPath,
            });
            setItems((prev) => [...prev, created]);
          } catch (err) {
            console.error(err);
            failedIndexes.push(index);
          } finally {
            done += 1;
            onProgress?.(done, total);
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
      setCollection(target);
      writeStoredCollection(target);
      failedIndexes.sort((a, b) => a - b);
      return { failedIndexes };
    },
    [userId],
  );

  const deleteItem = useCallback(async (id: string) => {
    const removed = itemsRef.current.find((item) => item.id === id);
    if (!removed) return;

    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteItemRow(removed);
    } catch (err) {
      setItems((prev) => [...prev, removed]);
      setError(describe(err));
    }
  }, []);

  const recordAnswer = useCallback(async (itemId: string, wasCorrect: boolean) => {
    const current = itemsRef.current.find((item) => item.id === itemId);
    if (!current) return;

    const updated: Item = {
      ...current,
      correct: current.correct + (wasCorrect ? 1 : 0),
      wrong: current.wrong + (wasCorrect ? 0 : 1),
    };
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));

    try {
      await updateAnswerCounts(updated);
    } catch (err) {
      // The answer stays on screen; the count simply will not survive a reload.
      console.error("Could not save the answer:", err);
    }
  }, []);

  /** Clears the deck in view only; every other deck keeps its progress. */
  const resetProgress = useCallback(async () => {
    if (collection === null) return;
    const target = collection;
    const snapshot = itemsRef.current;
    setItems(
      snapshot.map((item) =>
        normalizeCollectionName(item.collection) === target
          ? { ...item, correct: 0, wrong: 0 }
          : item,
      ),
    );
    try {
      await resetCounts(target);
    } catch (err) {
      setItems(snapshot);
      setError(describe(err));
    }
  }, [collection]);

  return {
    items,
    collections,
    selectedCollection: collection,
    selectCollection,
    visibleItems,
    stats,
    loaded,
    /** True once both the item list and the remembered deck have settled. */
    ready: loaded && selectionResolved,
    error,
    addItem,
    addItems,
    deleteItem,
    recordAnswer,
    resetProgress,
  };
}

/**
 * Move anything the previous localStorage version left behind into the signed-in
 * account, then clear it. Runs at most once per account per browser. Everything it
 * finds was a face, so it lands in the deck those items have always belonged to.
 */
async function importLegacyData(userId: string): Promise<void> {
  if (alreadyImported(userId)) return;

  const legacy = readLegacyItems();
  for (const entry of legacy) {
    try {
      const photoPath = await uploadItemPhoto(userId, entry.photo);
      const created = await insertItem({
        userId,
        collection: DEFAULT_COLLECTION,
        name: entry.name,
        photoPath,
      });
      if (entry.correct || entry.wrong) {
        await updateAnswerCounts({ ...created, correct: entry.correct, wrong: entry.wrong });
      }
    } catch (err) {
      // Skip the one that failed rather than abandoning the rest.
      console.error("Could not import a stored item:", err);
    }
  }

  clearLegacyStorage();
  markImported(userId);
}
