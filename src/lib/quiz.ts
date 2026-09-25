import type { Person } from "./people-store";

export type QuestionMode = "photo" | "name";

export type Question = {
  mode: QuestionMode;
  answer: Person;
  options: Person[];
};

export const MIN_PEOPLE = 4;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/** People answered wrong more often get a heavier weight. */
function weightOf(person: Person): number {
  const seen = person.correct + person.wrong;
  if (seen === 0) return 3;
  return 1 + person.wrong * 3 - Math.min(person.correct, 3) * 0.25;
}

function pickWeighted(people: Person[], excludeId?: string): Person {
  const pool = people.filter((p) => p.id !== excludeId);
  const source = pool.length > 0 ? pool : people;
  const weights = source.map((p) => Math.max(0.25, weightOf(p)));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < source.length; i++) {
    roll -= weights[i] ?? 0;
    const candidate = source[i];
    if (roll <= 0 && candidate) return candidate;
  }
  return source[source.length - 1] as Person;
}

export function buildQuestion(people: Person[], lastAnswerId?: string): Question | null {
  if (people.length < MIN_PEOPLE) return null;

  const answer = pickWeighted(people, people.length > MIN_PEOPLE ? lastAnswerId : undefined);
  const distractors = shuffle(people.filter((p) => p.id !== answer.id)).slice(0, 3);
  const options = shuffle([answer, ...distractors]);
  const mode: QuestionMode = Math.random() < 0.5 ? "photo" : "name";

  return { mode, answer, options };
}
