/**
 * KruMath's existing Supabase project. The URL and publishable key are public by design
 * (they ship in every browser bundle), so they are inlined at build time rather than read
 * from Worker bindings. A privileged server-side key must never be placed here.
 */
export const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Project ref, e.g. `diobjtrtyeggymdneyxv`. Used to find the session cookie/storage key. */
export const SUPABASE_PROJECT_REF = SUPABASE_URL
  ? new URL(SUPABASE_URL).hostname.split(".")[0]
  : undefined;

/** Supabase stores the session under this key, as a cookie (and, for older clients, in localStorage). */
export const AUTH_STORAGE_KEY = SUPABASE_PROJECT_REF
  ? `sb-${SUPABASE_PROJECT_REF}-auth-token`
  : undefined;

/** Anonymous sign-ins pass `getUser()` but must not be treated as real KruMath accounts. */
export function isAnonymousUser(user: {
  is_anonymous?: boolean;
  app_metadata?: Record<string, unknown>;
  identities?: unknown[];
}): boolean {
  if (user.is_anonymous === true) return true;
  if (user.app_metadata?.["provider"] === "anonymous") return true;
  if (Array.isArray(user.identities) && user.identities.length === 0) return true;
  return false;
}
