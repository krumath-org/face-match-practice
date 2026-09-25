import { createClientOnlyFn } from "@tanstack/react-start";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { isAnonymousUser, isSupabaseConfigured } from "@/lib/supabase/config";
import { buildSignInUrl } from "./config";
import type { ClientAuthOutcome } from "./session.client";

/**
 * Resolving the session needs browser storage, so it is marked client-only. On the
 * server this is a stub and the dynamic import is stripped from the server bundle.
 */
const resolveClientAuth = createClientOnlyFn(async (): Promise<ClientAuthOutcome> => {
  const { resolveClientAuth: resolve } = await import("./session.client");
  return resolve();
});

export type AuthState = {
  status: "pending" | "authenticated" | "unauthenticated";
  userId: string | null;
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
const DEV_AUTH_BYPASS = import.meta.env.DEV && import.meta.env["VITE_AUTH_BYPASS"] === "1";

function redirectToSignIn() {
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.replace(buildSignInUrl(returnTo));
}

export function AuthProvider({ initial, children }: { initial: AuthState; children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    DEV_AUTH_BYPASS
      ? { status: "authenticated", userId: "00000000-0000-0000-0000-000000000000" }
      : initial,
  );

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) await getSupabaseBrowserClient().auth.signOut();
    } catch {
      // Even if the call fails there is nothing left to grant access with.
    }
    setState({ status: "unauthenticated", userId: null });
    redirectToSignIn();
  }, []);

  // The server could not tell whether we are signed in, so ask the browser.
  useEffect(() => {
    if (DEV_AUTH_BYPASS || state.status !== "pending") return;
    let cancelled = false;
    void (async () => {
      const outcome = await resolveClientAuth();
      if (cancelled) return;
      if (outcome.status === "authenticated") {
        setState({ status: "authenticated", userId: outcome.userId });
      } else {
        setState({ status: "unauthenticated", userId: null });
        redirectToSignIn();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  // Keep in step with refreshes, sign-out, and expiry for the rest of the session.
  useEffect(() => {
    if (DEV_AUTH_BYPASS || !isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", userId: null });
        redirectToSignIn();
        return;
      }
      if (event !== "SIGNED_IN" && event !== "TOKEN_REFRESHED" && event !== "USER_UPDATED") return;

      const user = session?.user;
      if (user && !isAnonymousUser(user)) {
        setState({ status: "authenticated", userId: user.id });
      } else if (!user) {
        setState({ status: "unauthenticated", userId: null });
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
