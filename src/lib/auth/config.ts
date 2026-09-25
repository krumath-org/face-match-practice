/**
 * Where the KruMath sign-in page and platform links live. Only needed for the toolbar
 * links: the sign-in redirect itself is deliberately relative (see buildSignInUrl).
 */
const rawOrigin =
  (import.meta.env["VITE_KRUMATH_ORIGIN"] as string | undefined) ?? "https://krumath.com";

export const KRUMATH_ORIGIN = rawOrigin.replace(/\/+$/, "");

/**
 * Build the KruMath sign-in URL, carrying the page the user was trying to reach.
 *
 * Relative on purpose, per the integration doc section 6: on production it resolves
 * against krumath.com, so the user stays on the KruMath origin. The query parameter is
 * `returnUrl` — the name KruMath's `/sign-in` expects.
 */
export function buildSignInUrl(returnTo: string): string {
  const path = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
  return `/sign-in?returnUrl=${encodeURIComponent(path)}`;
}
