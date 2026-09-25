import { adoptLegacyStoredSession, getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { isAnonymousUser, isSupabaseConfigured } from "@/lib/supabase/config";
import { buildSignInUrl } from "./config";

export type ClientAuthOutcome =
  { status: "authenticated"; userId: string } | { status: "unauthenticated"; signInUrl: string };

function currentReturnTo(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
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
    const supabase = getSupabaseBrowserClient();
    let { data } = await supabase.auth.getSession();

    if (!data.session && (await adoptLegacyStoredSession(supabase))) {
      data = (await supabase.auth.getSession()).data;
    }

    const user = data.session?.user;
    if (!user || isAnonymousUser(user)) return signedOut;

    return { status: "authenticated", userId: user.id };
  } catch {
    return signedOut;
  }
}
