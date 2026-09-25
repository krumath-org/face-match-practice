import { useCallback, useEffect, useState } from "react";
import {
  loadPeople,
  loadStats,
  newId,
  savePeople,
  saveStats,
  type Person,
  type Stats,
} from "@/lib/people-store";

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPeople(loadPeople());
    setStats(loadStats());
    setLoaded(true);
  }, []);

  const addPerson = useCallback((name: string, photo: string) => {
    setPeople((prev) => {
      const next = [...prev, { id: newId(), name: name.trim(), photo, correct: 0, wrong: 0 }];
      savePeople(next);
      return next;
    });
  }, []);

  const deletePerson = useCallback((id: string) => {
    setPeople((prev) => {
      const next = prev.filter((p) => p.id !== id);
      savePeople(next);
      return next;
    });
  }, []);

  const recordAnswer = useCallback((personId: string, wasCorrect: boolean) => {
    setPeople((prev) => {
      const next = prev.map((p) =>
        p.id === personId
          ? {
              ...p,
              correct: p.correct + (wasCorrect ? 1 : 0),
              wrong: p.wrong + (wasCorrect ? 0 : 1),
            }
          : p,
      );
      savePeople(next);
      return next;
    });
    setStats((prev) => {
      const next = {
        correct: prev.correct + (wasCorrect ? 1 : 0),
        wrong: prev.wrong + (wasCorrect ? 0 : 1),
      };
      saveStats(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setPeople((prev) => {
      const next = prev.map((p) => ({ ...p, correct: 0, wrong: 0 }));
      savePeople(next);
      return next;
    });
    setStats(() => {
      const next = { correct: 0, wrong: 0 };
      saveStats(next);
      return next;
    });
  }, []);

  return { people, stats, loaded, addPerson, deletePerson, recordAnswer, resetProgress };
}
