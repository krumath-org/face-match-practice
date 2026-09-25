# Handoff: krumath.com main app

A prompt for whoever owns the krumath.com codebase. This is the only work needed on the
KruMath side; nothing in this repository changes KruMath's auth or sign-in.

---

## Prompt

> A KruMath tool is now deployed at `krumath.com/face-match-memorization` (its own repo:
> `sokna492-km/face-match-practice`, its own Cloudflare Worker `kruface`). It reuses the
> existing Supabase project and auth, and it is a **hard gate**: the whole tool requires a
> signed-in, non-anonymous account.
>
> Three small things on the krumath.com side make that work end to end. Please implement
> them, and note that they are independent of the tool's source repo — the tool should not
> be edited for any of this.
>
> **1. Honor `returnUrl` on `/sign-in`.** The tool redirects blocked users to
> `/sign-in?returnUrl=<path>`. After a successful sign-in, send the user to that path.
> Two requirements:
>
> - Report the param as `returnUrl`. The tool links to that exact name.
> - Allowlist the target before navigating. Accept only same-origin, absolute paths that
>   start with a single `/` (reject `//host`, `/\host`, anything with a scheme, and
>   anything not on `krumath.com`). Without the allowlist this is an open redirect.
>
> After login the user should land back on the tool route they asked for, e.g.
> `/face-match-memorization/people`, not on `/home`.
>
> **2. Make sure auth cookies are readable at the subpath.** The tool runs at
> `/face-match-memorization/*` on `krumath.com`, and its server reads the session cookie to
> decide access before rendering. Cookies must be set with `path=/` (and the platform's
> `domain`/`sameSite`/`secure` settings as they are today). If the session is ever written
> with a narrower path — or only into `localStorage` rather than a cookie — the tool cannot
> see it server-side. It will still work, but it degrades to a client-side check and the
> user sees a brief loading state before the gate resolves.
>
> **3. Propagate logout.** When a user signs out on krumath.com, their session cookies for
> the project must clear too, so `/face-match-memorization` immediately requires sign-in
> again rather than continuing to serve a stale session. The tool signs out through the
> shared Supabase client, so a Supabase `signOut()` on the KruMath side is enough — just
> make sure it happens on every logout path.
>
> Optionally, once the tool is verified in production, add its entry link to the
> appropriate KruMath page.

---

## Why each item matters

| Item                 | If skipped                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Honor `returnUrl`    | Users sign in successfully, then land on `/home`, and have to find the tool again.                                        |
| Allowlist the target | Open redirect: `?returnUrl=https://evil.example` turns the sign-in page into a phishing hop.                              |
| Cookie `path=/`      | The server never sees a session cookie at the subpath, so the gate falls back to the browser and flashes a loading state. |
| Propagate logout     | Signing out on KruMath leaves the tool accessible until the token expires.                                                |
| Anonymous refusal    | Anonymous sessions hold a valid JWT and would otherwise pass `auth.uid()` checks.                                         |

## What the tool already does on its side

- Reads the session cookie server-side via `@supabase/ssr` and rejects bad, missing, or
  anonymous sessions with a `302` before rendering.
- Falls back to a browser-side check only when no cookie is present at all.
- Redirects to a **relative** `/sign-in?returnUrl=...`, so it stays on the `krumath.com`
  origin by construction.
- Handles token refresh, expiry, and its own sign-out button, all through
  `onAuthStateChange`.
- Uses only the publishable key; no privileged key exists in the tool or its build.

## Verification

1. Signed out, open `krumath.com/face-match-memorization/people` → lands on
   `/sign-in?returnUrl=/face-match-memorization/people`.
2. Sign in → lands on `/face-match-memorization/people`.
3. `?returnUrl=https://example.com` and `?returnUrl=//example.com` → must **not** navigate
   off-site.
4. Sign out on krumath.com, then open `/face-match-memorization` → blocked again.
5. Sign out from inside the tool → krumath.com is signed out too.
