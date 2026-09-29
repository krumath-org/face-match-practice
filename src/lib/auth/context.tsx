import { createClientOnlyFn } from "@tanstack/react-start";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { isAnonymousUser, isSupabaseConfigured } from "@/lib/supabase/config";
import { buildSignInUrl, KRUMATH_ORIGIN, type UserProfile } from "./config";
import type { ClientAuthOutcome } from "./session.client";

/**
 * Resolving the session needs browser storage, so it is marked client-only. On the
 * server this is a stub and the dynamic import is stripped from the server bundle.
 */
const resolveClientAuth = createClientOnlyFn(async (): Promise<ClientAuthOutcome> => {
  const { resolveClientAuth: resolve } = await import("./session.client");
  return resolve();
});

/** Same split for the account-menu display fields, which are fetched in the browser. */
const resolveClientProfile = createClientOnlyFn(async (): Promise<UserProfile | null> => {
  const { resolveClientProfile: resolve } = await import("./session.client");
  return resolve();
});

export type AuthState = {
  status: "pending" | "authenticated" | "unauthenticated";
  userId: string | null;
  /** Toolbar display fields. Null until resolved in the browser, or when unavailable. */
  profile: UserProfile | null;
};

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Local UI work only, and never in a production build: `import.meta.env.DEV` is a
 * compile-time `false` there, so this collapses to dead code. It exists because a
 * localhost origin cannot hold krumath.com's session cookie.
 */
export const DEV_AUTH_BYPASS = import.meta.env.DEV && import.meta.env["VITE_AUTH_BYPASS"] === "1";

/**
 * Placeholder uid used only while {@link DEV_AUTH_BYPASS} is on. It is not a real
 * `auth.users` row, so Storage/RLS rejects every write under this id.
 */
export const DEV_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000000";

/** Placeholder identity so the account menu is workable while the bypass is on. */
const DEV_PROFILE: UserProfile = { name: "Local dev", email: "dev@localhost" };

function redirectToSignIn() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.replace(buildSignInUrl(returnTo));
}

export function AuthProvider({ initial, children }: { initial: AuthState; children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    DEV_AUTH_BYPASS
      ? {
          status: "authenticated",
          userId: DEV_BYPASS_USER_ID,
          profile: DEV_PROFILE,
        }
      : initial,
  );

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) await getSupabaseBrowserClient().auth.signOut();
    } catch {
      // Even if the call fails there is nothing left to grant access with.
    }
    setState({ status: "unauthenticated", userId: null, profile: null });
    // A deliberate sign-out is not a blocked visit, so land on KruMath home the way
    // krumath.com's own header does rather than bouncing through the sign-in page.
    if (typeof window !== "undefined") window.location.assign(`${KRUMATH_ORIGIN}/home`);
  }, []);

  // The server could not tell whether we are signed in, so ask the browser.
  useEffect(() => {
    if (DEV_AUTH_BYPASS || state.status !== "pending") return;
    let cancelled = false;
    void (async () => {
      const outcome = await resolveClientAuth();
      if (cancelled) return;
      if (outcome.status === "authenticated") {
        setState({ status: "authenticated", userId: outcome.userId, profile: outcome.profile });
      } else {
        setState({ status: "unauthenticated", userId: null, profile: null });
        redirectToSignIn();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  // The server only vouches for a user id, so the menu's name and avatar are filled in
  // here. Doing it in the browser also keeps the email out of the SSR payload.
  useEffect(() => {
    if (DEV_AUTH_BYPASS || !isSupabaseConfigured()) return;
    if (state.status !== "authenticated" || state.profile) return;

    let cancelled = false;
    void (async () => {
      const profile = await resolveClientProfile();
      if (cancelled || !profile) return;
      setState((prev) => (prev.status === "authenticated" ? { ...prev, profile } : prev));
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status, state.profile]);

  // Keep in step with refreshes, sign-out, and expiry for the rest of the session.
  useEffect(() => {
    if (DEV_AUTH_BYPASS || !isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", userId: null, profile: null });
        redirectToSignIn();
        return;
      }
      if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED" && event !== "USER_UPDATED") return;

      const user = session?.user;
      if (user && !isAnonymousUser(user)) {
        // Keep whatever the toolbar already has so a token refresh does not blink the
        // avatar; the effect above fills it in when it is still missing.
        setState((prev) => ({
          status: "authenticated",
          userId: user.id,
          profile: prev.status === "authenticated" ? prev.profile : null,
        }));
      } else if (!user) {
        setState({ status: "unauthenticated", userId: null, profile: null });
        redirectToSignIn();
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ ...state, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider.");
  return context;
}
