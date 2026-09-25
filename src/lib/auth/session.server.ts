import "@tanstack/react-start/server-only";

import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";

import { isAnonymousUser } from "@/lib/supabase/config";
import { getSupabaseServerClient, hasSessionCookie } from "@/lib/supabase/server-client.server";
import { buildSignInUrl } from "./config";

export type ServerAuthOutcome =
  | { status: "authenticated"; userId: string }
  | { status: "unauthenticated"; signInUrl: string }
  | { status: "unknown" };

/**
 * Resolve the signed-in KruMath user from the request cookies.
 *
 * `unknown` is deliberately distinct from `unauthenticated`: with no session cookie at
 * all the user may still hold a client-side session the server cannot see, so the
 * browser is given the chance to decide rather than being bounced to sign-in.
 *
 * Overrides let request middleware supply the values from the raw `Request` instead of
 * the ambient request context.
 */
export async function resolveServerAuth(overrides?: {
  cookieHeader?: string | undefined;
  returnTo?: string | undefined;
}): Promise<ServerAuthOutcome> {
  let returnTo = overrides?.returnTo;
  if (returnTo === undefined) {
    const url = getRequestUrl();
    returnTo = `${url.pathname}${url.search}`;
  }

  const cookieHeader = overrides?.cookieHeader ?? getRequestHeader("cookie");
  const signedOut: ServerAuthOutcome = {
    status: "unauthenticated",
    signInUrl: buildSignInUrl(returnTo),
  };

  const supabase = getSupabaseServerClient(cookieHeader);
  if (!supabase) return signedOut;
  if (!hasSessionCookie(cookieHeader)) return { status: "unknown" };

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return signedOut;
    if (isAnonymousUser(data.user)) return signedOut;
    return { status: "authenticated", userId: data.user.id };
  } catch {
    // Treat an unreachable auth server as signed out rather than serving private data.
    return signedOut;
  }
}

/**
 * Build the redirect used when a request must not proceed. Returning this straight from
 * request middleware keeps the Location exactly as written; the router's own redirect
 * resolves it against the router basepath and mangles the path.
 */
export function signInRedirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "cache-control": "no-store" },
  });
}
