import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export type Person = {
  id: string;
  name: string;
  /** Short-lived signed URL for display; the bucket itself stays private. */
  photo: string;
  /** Storage object path, kept so the photo can be removed with the person. */
  photoPath: string;
  correct: number;
  wrong: number;
};

export type Stats = {
  correct: number;
  wrong: number;
};

export const PHOTO_BUCKET = "face-match-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const LEGACY_PEOPLE_KEY = "faces.people.v1";
const LEGACY_STATS_KEY = "faces.stats.v1";

type PersonRow = {
  id: string;
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
export async function uploadPersonPhoto(userId: string, dataUrl: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const blob = dataUrlToBlob(dataUrl);
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

export async function fetchPeople(): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("face_match_people")
    .select("id, name, photo_path, correct, wrong")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as PersonRow[];
  if (rows.length === 0) return [];

  // One batched call rather than one per photo.
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
    name: row.name,
    photo: urlByPath.get(row.photo_path) ?? "",
    photoPath: row.photo_path,
    correct: row.correct,
    wrong: row.wrong,
  }));
}

export async function insertPerson(input: {
  userId: string;
  name: string;
  photoPath: string;
}): Promise<Person> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("face_match_people")
    .insert({ user_id: input.userId, name: input.name, photo_path: input.photoPath })
    .select("id, name, photo_path, correct, wrong")
    .single();
  if (error) throw error;

  const row = data as PersonRow;
  return {
    id: row.id,
    name: row.name,
    photo: await signPhotoPath(row.photo_path),
    photoPath: row.photo_path,
    correct: row.correct,
    wrong: row.wrong,
  };
}

export async function deletePersonRow(person: Person): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("face_match_people").delete().eq("id", person.id);
  if (error) throw error;

  // Best effort: the row is gone either way, and a stray object is invisible to
  // every other user because of the bucket policies.
  await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([person.photoPath])
    .catch(() => undefined);
}

export async function updateAnswerCounts(person: Person): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("face_match_people")
    .update({ correct: person.correct, wrong: person.wrong })
    .eq("id", person.id);
  if (error) throw error;
}

export async function resetCounts(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("face_match_people")
    .update({ correct: 0, wrong: 0 })
    .not("id", "is", null);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

/** Overall accuracy is folded up from the rows the user currently has. */
export function summarise(people: Person[]): Stats {
  return people.reduce<Stats>(
    (total, person) => ({
      correct: total.correct + person.correct,
      wrong: total.wrong + person.wrong,
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

export type LegacyPerson = {
  id: string;
  name: string;
  photo: string;
  correct: number;
  wrong: number;
};

export function readLegacyPeople(): LegacyPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_PEOPLE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegacyPerson[];
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
