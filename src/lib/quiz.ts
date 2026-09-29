import type { Item } from "./items-store";

export type QuestionMode = "photo" | "name";

export type Question = {
  mode: QuestionMode;
  answer: Item;
  options: Item[];
};

/** Four options have to fit on screen at once, so a deck needs at least this many. */
export const MIN_ITEMS = 4;

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

/** Items answered wrong more often get a heavier weight. */
function weightOf(item: Item): number {
  const seen = item.correct + item.wrong;
  if (seen === 0) return 3;
  return 1 + item.wrong * 3 - Math.min(item.correct, 3) * 0.25;
}

function pickWeighted(items: Item[], excludeId?: string): Item {
  const pool = items.filter((item) => item.id !== excludeId);
  const source = pool.length > 0 ? pool : items;
  const weights = source.map((item) => Math.max(0.25, weightOf(item)));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < source.length; i++) {
    roll -= weights[i] ?? 0;
    const candidate = source[i];
    if (roll <= 0 && candidate) return candidate;
  }
  return source[source.length - 1] as Item;
}

export function buildQuestion(items: Item[], lastAnswerId?: string): Question | null {
  if (items.length < MIN_ITEMS) return null;

  const answer = pickWeighted(items, items.length > MIN_ITEMS ? lastAnswerId : undefined);
  const distractors = shuffle(items.filter((item) => item.id !== answer.id)).slice(0, 3);
  const options = shuffle([answer, ...distractors]);
  const mode: QuestionMode = Math.random() < 0.5 ? "photo" : "name";

  return { mode, answer, options };
}
