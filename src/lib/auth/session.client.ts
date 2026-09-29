import type { User } from "@supabase/supabase-js";

import { adoptLegacyStoredSession, getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { isAnonymousUser, isSupabaseConfigured } from "@/lib/supabase/config";
import { buildSignInUrl, type UserProfile } from "./config";

export type ClientAuthOutcome =
  | { status: "authenticated"; userId: string; profile: UserProfile }
  | { status: "unauthenticated"; signInUrl: string };

function currentReturnTo(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Pull the few display fields the toolbar needs out of a Supabase user. KruMath has
 * signed users in through more than one provider over time, so the name and avatar are
 * read from whichever metadata key is actually populated.
 */
export function profileFromUser(user: User): UserProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const text = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;

  return {
    email: text(user.email),
    name: text(meta["name"]) ?? text(meta["full_name"]) ?? text(meta["display_name"]),
    avatarUrl: text(meta["avatar_url"]) ?? text(meta["photoURL"]) ?? text(meta["picture"]),
  };
}

/**
 * The signed-in user, or null when there is no usable session.
 *
 * The shared session is a cookie (`sb-<ref>-auth-token`, `domain=.krumath.com`). A
 * browser that still has the pre-cookie `localStorage` copy is migrated once via
 * `adoptLegacyStoredSession`, so returning visitors are not signed out by the change.
 */
async function currentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  let { data } = await supabase.auth.getSession();

  if (!data.session && (await adoptLegacyStoredSession(supabase))) {
    data = (await supabase.auth.getSession()).data;
  }

  const user = data.session?.user;
  if (!user || isAnonymousUser(user)) return null;
  return user;
}

/**
 * Browser-side equivalent of the server check. Used when the server found no session
 * cookie, and to react to sign-out or expiry afterwards.
 */
export async function resolveClientAuth(): Promise<ClientAuthOutcome> {
  const returnTo = currentReturnTo();
  const signedOut: ClientAuthOutcome = {
    status: "unauthenticated",
    signInUrl: buildSignInUrl(returnTo),
  };

  if (!isSupabaseConfigured()) return signedOut;

  try {
    const user = await currentUser();
    if (!user) return signedOut;
    return { status: "authenticated", userId: user.id, profile: profileFromUser(user) };
  } catch {
    return signedOut;
  }
}

/**
 * Display fields for an account the server already vouched for. Resolved in the browser
 * rather than during SSR, which keeps the email out of the rendered HTML.
 */
export async function resolveClientProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const user = await currentUser();
    return user ? profileFromUser(user) : null;
  } catch {
    return null;
  }
}
