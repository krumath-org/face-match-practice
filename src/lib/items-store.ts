import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

/**
 * Table and bucket names are frozen identifiers from when this tool only drilled faces.
 * They are deliberately kept: the table name is baked into the deployed RLS policies and
 * the bucket holds every picture already uploaded, so renaming either would mean a
 * migration over live rows and objects for no user-visible gain. Neither is ever shown.
 */
const TABLE = "face_match_people";
export const PHOTO_BUCKET = "face-match-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const ITEM_COLUMNS = "id, collection, name, photo_path, correct, wrong";

/** Data left behind by the pre-KruMath localStorage version of this tool. */
const LEGACY_PEOPLE_KEY = "faces.people.v1";
const LEGACY_STATS_KEY = "faces.stats.v1";

export type Item = {
  id: string;
  /** The deck this item belongs to. */
  collection: string;
  /** What the user has to recall: a person's name, a word, a term. */
  name: string;
  /** Short-lived signed URL for display; the bucket itself stays private. */
  photo: string;
  /** Storage object path, kept so the picture can be removed with the item. */
  photoPath: string;
  correct: number;
  wrong: number;
};

export type Stats = {
  correct: number;
  wrong: number;
};

type ItemRow = {
  id: string;
  collection: string;
  name: string;
  photo_path: string;
  correct: number;
  wrong: number;
};

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const meta = comma === -1 ? "" : dataUrl.slice(0, comma);
  const payload = comma === -1 ? "" : dataUrl.slice(comma + 1);
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";

  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extensionFor(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

/** Uploads into the caller's own folder, which is the only place RLS allows. */
export async function uploadItemPhoto(userId: string, photo: string | Blob): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const blob = typeof photo === "string" ? dataUrlToBlob(photo) : photo;
  const contentType = blob.type || "image/jpeg";
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(contentType)}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType, upsert: false });
  if (error) throw error;
  return path;
}

export async function signPhotoPath(path: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data?.signedUrl ?? "";
}

// ---------------------------------------------------------------------------
// Reads and writes
// ---------------------------------------------------------------------------

/**
 * Every item the user owns, across all their decks. Fetching the lot in one go is what
 * lets the deck switcher show per-deck counts without a second round trip, and these
 * collections are personal and small.
 */
export async function fetchItems(): Promise<Item[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(ITEM_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as ItemRow[];
  if (rows.length === 0) return [];

  // One batched call rather than one per picture.
  const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(
    rows.map((row) => row.photo_path),
    SIGNED_URL_TTL_SECONDS,
  );

  const urlByPath = new Map<string, string>();
  for (const entry of signed ?? []) {
    if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
  }

  return rows.map((row) => ({
    id: row.id,
    collection: row.collection,
    name: row.name,
    photo: urlByPath.get(row.photo_path) ?? "",
    photoPath: row.photo_path,
    correct: row.correct,
    wrong: row.wrong,
  }));
}

export async function insertItem(input: {
  userId: string;
  collection: string;
  name: string;
  photoPath: string;
}): Promise<Item> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: input.userId,
      collection: input.collection,
      name: input.name,
      photo_path: input.photoPath,
    })
    .select(ITEM_COLUMNS)
    .single();
  if (error) throw error;

  const row = data as ItemRow;
  return {
    id: row.id,
    collection: row.collection,
    name: row.name,
    photo: await signPhotoPath(row.photo_path),
    photoPath: row.photo_path,
    correct: row.correct,
    wrong: row.wrong,
  };
}

export async function deleteItemRow(item: Item): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", item.id);
  if (error) throw error;

  // Best effort: the row is gone either way, and a stray object is invisible to
  // every other user because of the bucket policies.
  await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([item.photoPath])
    .catch(() => undefined);
}

export async function updateAnswerCounts(item: Item): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ correct: item.correct, wrong: item.wrong })
    .eq("id", item.id);
  if (error) throw error;
}

/** Zeroes one deck. RLS already limits the update to rows this user owns. */
export async function resetCounts(collection: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ correct: 0, wrong: 0 })
    .eq("collection", collection);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

/** Accuracy is folded up from whatever is in scope: one deck, or every deck at once. */
export function summarise(items: readonly Item[]): Stats {
  return items.reduce<Stats>(
    (total, item) => ({
      correct: total.correct + item.correct,
      wrong: total.wrong + item.wrong,
    }),
    { correct: 0, wrong: 0 },
  );
}

export function accuracy(stats: Stats): number | null {
  const total = stats.correct + stats.wrong;
  if (total === 0) return null;
  return Math.round((stats.correct / total) * 100);
}

// ---------------------------------------------------------------------------
// One-time import of data left over from the previous localStorage version
// ---------------------------------------------------------------------------

export type LegacyItem = {
  id: string;
  name: string;
  photo: string;
  correct: number;
  wrong: number;
};

export function readLegacyItems(): LegacyItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_PEOPLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegacyItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry) =>
        entry &&
        typeof entry.name === "string" &&
        typeof entry.photo === "string" &&
        entry.photo.startsWith("data:"),
    );
  } catch {
    return [];
  }
}

export function clearLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_PEOPLE_KEY);
    window.localStorage.removeItem(LEGACY_STATS_KEY);
  } catch {
    // Nothing more we can do; the import marker stops it repeating.
  }
}
