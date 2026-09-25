export type Person = {
  id: string;
  name: string;
  photo: string; // data URL
  correct: number;
  wrong: number;
};

export type Stats = {
  correct: number;
  wrong: number;
};

const PEOPLE_KEY = "faces.people.v1";
const STATS_KEY = "faces.stats.v1";

export function loadPeople(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PEOPLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Person[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePeople(people: Person[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
}

export function loadStats(): Stats {
  if (typeof window === "undefined") return { correct: 0, wrong: 0 };
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { correct: 0, wrong: 0 };
    const parsed = JSON.parse(raw) as Stats;
    return {
      correct: Number(parsed?.correct) || 0,
      wrong: Number(parsed?.wrong) || 0,
    };
  } catch {
    return { correct: 0, wrong: 0 };
  }
}

export function saveStats(stats: Stats) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function accuracy(stats: Stats): number | null {
  const total = stats.correct + stats.wrong;
  if (total === 0) return null;
  return Math.round((stats.correct / total) * 100);
}

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
