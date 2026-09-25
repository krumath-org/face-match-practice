import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_STORAGE_KEY, isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let cached: SupabaseClient | undefined;

/**
 * Browser client on the existing KruMath project. Running on the same origin as
 * krumath.com means it reads and writes the same session storage, so signing in on
 * either side is visible to the other.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  cached ??= createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
  return cached;
}

/**
 * KruMath may hold its session with a plain supabase-js client, which writes to
 * localStorage rather than cookies. When that is the case there is no cookie for the
 * server to read, so adopt the stored session before concluding the user is signed out.
 */
export async function adoptLegacyStoredSession(client: SupabaseClient): Promise<boolean> {
  if (!AUTH_STORAGE_KEY || typeof window === "undefined") return false;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const nested = (parsed["currentSession"] ?? parsed) as Record<string, unknown>;
    const accessToken = nested["access_token"];
    const refreshToken = nested["refresh_token"];
    if (typeof accessToken !== "string" || typeof refreshToken !== "string") return false;

    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return !error;
  } catch {
    return false;
  }
}
