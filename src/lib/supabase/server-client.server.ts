import "@tanstack/react-start/server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader, setCookie } from "@tanstack/react-start/server";

import { AUTH_STORAGE_KEY, isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Minimal RFC 6265 cookie header parser; only name/value pairs are needed. */
function parseCookieHeader(header: string): Array<{ name: string; value: string }> {
  if (!header) return [];
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const eq = part.indexOf("=");
      if (eq < 1) return [];
      const name = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (!name) return [];
      try {
        return [{ name, value: decodeURIComponent(value) }];
      } catch {
        return [{ name, value }];
      }
    });
}

/**
 * Server client bound to the incoming request's cookies. Returns null when Supabase is
 * not configured so callers can decide how to degrade instead of crashing.
 *
 * `cookieHeader` lets request middleware pass the header explicitly instead of relying
 * on the ambient request context.
 */
export function getSupabaseServerClient(cookieHeader?: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  return createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookieHeader ?? getRequestHeader("cookie") ?? "");
      },
      setAll(cookies) {
        for (const cookie of cookies) {
          try {
            setCookie(cookie.name, cookie.value, cookie.options as never);
          } catch {
            // Response headers already flushed; the browser client refreshes instead.
          }
        }
      },
    },
  });
}

/**
 * Whether the request carries a Supabase session cookie at all. This distinguishes
 * "signed out" from "signed in client-side only", which the server cannot otherwise
 * tell apart.
 */
export function hasSessionCookie(cookieHeader?: string): boolean {
  const storageKey = AUTH_STORAGE_KEY;
  if (!storageKey) return false;
  const header = cookieHeader ?? getRequestHeader("cookie");
  if (!header) return false;
  return parseCookieHeader(header).some((cookie) => cookie.name.startsWith(storageKey));
}
