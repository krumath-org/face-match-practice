import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { AUTH_STORAGE_KEY, isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { getKrumathSupabaseCookieOptions } from "./krumathCookies";

let cached: SupabaseClient | undefined;

/**
 * Browser client on the existing KruMath project.
 *
 * The session lives in `@supabase/ssr` cookies (`sb-<projectRef>-auth-token…`) at
 * `path=/` with `domain=.krumath.com` — the same store KruMath's main app writes and the
 * same store this Worker's server client reads. The explicit cookie options matter:
 * `@supabase/ssr` defaults have no `domain`, which would create a host-only cookie
 * alongside KruMath's shared one and make the two disagree about who is signed in.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  if (cached) return cached;

  cached = createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookieOptions: getKrumathSupabaseCookieOptions(
      typeof window !== "undefined" ? window.location.hostname : undefined,
      typeof window !== "undefined" ? window.location.protocol === "https:" : true,
    ),
    isSingleton: false,
    auth: { detectSessionInUrl: false },
  });
  return cached;
}

/**
 * Transition helper for browsers that still hold the pre-cookie session in
 * `localStorage` under `sb-<ref>-auth-token`. KruMath no longer writes there, but a
 * returning visitor may still have it; adopting it once migrates them onto the cookie.
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
