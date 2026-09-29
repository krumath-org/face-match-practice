import type { CookieOptions } from "@supabase/ssr";

/**
 * KruMath shared-session contract.
 *
 * KruMath keeps its Supabase session in `@supabase/ssr` cookies at `path=/` with
 * `domain=.krumath.com`. This app is served from `krumath.com/face-match-memorization`,
 * so it must read and write that exact store — see
 * `KruMath/.cursor/rules/shared-session-contract.mdc`.
 *
 * `@supabase/ssr`'s `DEFAULT_COOKIE_OPTIONS` set `path=/` and `sameSite=lax` but **no
 * `domain`**. Creating a client without these options writes a host-only cookie alongside
 * KruMath's `Domain=.krumath.com` cookie: two cookies with the same name, and the two
 * sides disagree about who is signed in.
 */

/** Hosts that share `.krumath.com` cookies for main ↔ feature-app SSO. */
const SHARED_COOKIE_HOSTS = new Set(["krumath.com", "www.krumath.com"]);

/** Staging-like hosts must NOT share production `.krumath.com` cookies. */
function isStagingLikeKrumathHost(host: string): boolean {
  if (host === "staging.krumath.com" || host.startsWith("staging.")) return true;
  if (host.includes("-staging.") || host.endsWith("-staging.krumath.com")) return true;
  return false;
}

/**
 * Shared auth cookie domain for production `krumath.com`.
 * Returns `undefined` on localhost, workers.dev and staging hosts so cookies stay
 * host-only.
 */
export function getKrumathCookieDomain(hostname: string | undefined | null): string | undefined {
  if (!hostname) return undefined;
  const host = hostname.toLowerCase().split(":")[0] ?? "";
  if (!host) return undefined;
  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1") return undefined;
  if (!host.endsWith("krumath.com")) return undefined;
  if (isStagingLikeKrumathHost(host)) return undefined;
  if (SHARED_COOKIE_HOSTS.has(host)) return ".krumath.com";
  // Unknown *.krumath.com (e.g. future prod subdomains): share for SSO unless staging-like.
  return ".krumath.com";
}

/** `@supabase/ssr` cookie options for the shared session. */
export function getKrumathSupabaseCookieOptions(
  hostname: string | undefined | null,
  isHttps = true,
): CookieOptions {
  const base: CookieOptions = { path: "/", sameSite: "lax", secure: isHttps };
  const domain = getKrumathCookieDomain(hostname);
  return domain ? { ...base, domain } : base;
}

/** Add the shared `.krumath.com` domain to options the library already produced. */
export function mergeKrumathCookieOptions<T extends { domain?: string }>(
  options: T,
  hostname: string | undefined | null,
): T {
  const domain = getKrumathCookieDomain(hostname);
  if (!domain) return options;
  return { ...options, domain };
}
