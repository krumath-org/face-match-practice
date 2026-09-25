import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/context";
import {
  clearLegacyStorage,
  deletePersonRow,
  fetchPeople,
  insertPerson,
  readLegacyPeople,
  resetCounts,
  summarise,
  updateAnswerCounts,
  uploadPersonPhoto,
  type Person,
} from "@/lib/people-store";

/** Records that this browser has already handed its old data to a KruMath account. */
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

export function usePeople() {
  const { userId } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors state so async callbacks never read a stale list.
  const peopleRef = useRef<Person[]>([]);
  useEffect(() => {
    peopleRef.current = people;
  }, [people]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    void (async () => {
      setLoaded(false);
      try {
        await importLegacyData(userId);
        if (cancelled) return;
        setPeople(await fetchPeople());
        setError(null);
      } catch (err) {
        if (!cancelled) setError(describe(err));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addPerson = useCallback(
    async (name: string, photoDataUrl: string) => {
      if (!userId) return;
      const photoPath = await uploadPersonPhoto(userId, photoDataUrl);
      const created = await insertPerson({ userId, name: name.trim(), photoPath });
      setPeople((prev) => [...prev, created]);
    },
    [userId],
  );

  const deletePerson = useCallback(async (id: string) => {
    const removed = peopleRef.current.find((person) => person.id === id);
    if (!removed) return;

    setPeople((prev) => prev.filter((person) => person.id !== id));
    try {
      await deletePersonRow(removed);
    } catch (err) {
      setPeople((prev) => [...prev, removed]);
      setError(describe(err));
    }
  }, []);

  const recordAnswer = useCallback(async (personId: string, wasCorrect: boolean) => {
    const current = peopleRef.current.find((person) => person.id === personId);
    if (!current) return;

    const updated: Person = {
      ...current,
      correct: current.correct + (wasCorrect ? 1 : 0),
      wrong: current.wrong + (wasCorrect ? 0 : 1),
    };
    setPeople((prev) => prev.map((person) => (person.id === personId ? updated : person)));

    try {
      await updateAnswerCounts(updated);
    } catch (err) {
      // The answer stays on screen; the count simply will not survive a reload.
      console.error("Could not save the answer:", err);
    }
  }, []);

  const resetProgress = useCallback(async () => {
    const snapshot = peopleRef.current;
    setPeople(snapshot.map((person) => ({ ...person, correct: 0, wrong: 0 })));
    try {
      await resetCounts();
    } catch (err) {
      setPeople(snapshot);
      setError(describe(err));
    }
  }, []);

  const stats = useMemo(() => summarise(people), [people]);

  return { people, stats, loaded, error, addPerson, deletePerson, recordAnswer, resetProgress };
}

/**
 * Move anything the previous localStorage version left behind into the signed-in
 * account, then clear it. Runs at most once per account per browser.
 */
async function importLegacyData(userId: string): Promise<void> {
  if (alreadyImported(userId)) return;

  const legacy = readLegacyPeople();
  for (const entry of legacy) {
    try {
      const photoPath = await uploadPersonPhoto(userId, entry.photo);
      const created = await insertPerson({ userId, name: entry.name, photoPath });
      if (entry.correct || entry.wrong) {
        await updateAnswerCounts({ ...created, correct: entry.correct, wrong: entry.wrong });
      }
    } catch (err) {
      // Skip the one that failed rather than abandoning the rest.
      console.error("Could not import a stored face:", err);
    }
  }

  clearLegacyStorage();
  markImported(userId);
}
