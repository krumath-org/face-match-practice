# KruMemory

A small app for drilling anything you keep mixing up — people's names, vocabulary,
symbols, formulas — one picture and one name at a time. It runs as a tool inside
[KruMath](https://krumath.com) at
[krumath.com/face-match-memorization](https://krumath.com/face-match-memorization).

It is a hard-gated tool: a signed-in KruMath account is required, and anonymous Supabase
sessions are refused. Items, pictures, and progress are stored in the shared KruMath
Supabase project, scoped to the signed-in user by row level security.

## Why the old names are still around

The public URL still says `face-match-memorization`, and the database table
(`face_match_people`) and storage bucket (`face-match-photos`) keep their original names
too. All three are frozen on purpose: the URL is a live link that would break, and the
other two are referenced by deployed policies and hold every picture already uploaded, so
renaming them would mean a migration over live rows for no user-visible gain.

None of them are ever shown to a user — the app calls itself KruMemory, and the table is
deliberately generic (`collection`, `name`, `photo_path`, two counters), so a row is simply
one picture plus the label to remember.

## How it works

- **Practice** — start a quiz for the selected collection straight from the home page.
- **Items** — a grid of everything in the selected collection, with an add button and
  per-item delete.
- **Add item** — pick a picture, type the name or label, and choose the collection it
  belongs to. The picture is uploaded to Supabase Storage.

**Collections** are how one app covers several subjects. A collection is a user-named deck
— "People", "French words", "Physics" — and items never leave it, so a vocabulary picture
can never turn up as a distractor for a person's name. The switcher sits on the home and
item screens, and the choice is remembered in `localStorage`.

A collection exists only as a name on its items, so there is no separate list to maintain:
typing a new name on the add screen creates it. Names are compared case-insensitively, so
"french" reuses an existing "French" rather than starting a second deck. A collection needs
at least four items before it can be practised, because every question offers four options.

Each round builds one of two question types at random, drawing the answer and the
distractors from a single collection:

- **Picture → name**: show a picture with four name cards.
- **Name → picture**: show a name with four pictures.

Answers and option order are shuffled every time, and you get immediate feedback plus the
correct answer whenever you miss. Items you get wrong more often are weighted to come up
more frequently, so weak ones repeat until they stick.

Accuracy is tracked per item and per collection, and shown on the home page and during
practice. Progress in one collection never affects another.

## Authentication

The app reuses KruMath's Supabase Auth project. There is no separate account system, and
KruMath's own sign-in page is never rebuilt here.

The gate is enforced in two places:

- **Server, primary.** `src/start.ts` adds request middleware that reads the Supabase
  session cookie and rejects the request with a `302` when the session is missing, invalid,
  or anonymous. This runs before any page work.
- **Browser, fallback.** When a request carries no session cookie at all, the server cannot
  know whether the user is signed in, so `AuthProvider` resolves the session in the browser
  (including adopting a session left in `localStorage`) and redirects if that fails too.

Blocked users go to `/sign-in?returnUrl=<attempted path>`. The URL is relative on purpose:
on production it resolves against `krumath.com`, so the user stays on the KruMath origin.
The param name `returnUrl` matches what KruMath's sign-in page expects.

Sign-out and expiry are handled through `onAuthStateChange`. The toolbar's account menu shows
the signed-in name, email, and avatar, links to KruMath's account settings, and signs out;
sign-out returns to `krumath.com/home`, matching KruMath's own header. Those display fields
are resolved in the browser rather than during SSR, so the email never travels in the page
HTML. Only the publishable key is used anywhere — a privileged server-side key must never be
added to this project.

## Localization

English and Khmer, switched from the toolbar and persisted in `localStorage`. The
dictionary and provider live in `src/lib/i18n/`. There is no i18n dependency; `t()` is a
typed lookup, so a missing Khmer string is a compile error rather than a silent fallback.

Khmer needs a different typeface than Space Grotesk, so `Noto Sans Khmer` is loaded
alongside it and added to `--font-sans` in `src/styles.css`.

`i18n-review.json` is the reviewed source of truth: every key, where it appears on screen,
and both values. Keep it in step with the dictionary when copy changes.

The strings added when the tool was generalised — the collection, item and picture wording
— are machine-authored and have not been reviewed by a native speaker yet. Each one is
marked `Pending native-speaker review.` in `i18n-review.json`.

## Database setup

The table and private storage bucket are declared in one idempotent file:

```
supabase/face-match-memorization.sql
```

Paste it into the Supabase SQL Editor and run it. It is safe to run more than once: it only
creates the objects that are missing and adds the column if it is absent. A commented-out
rollback block sits at the bottom.

It creates `public.face_match_people` (RLS on, one policy keyed to `auth.uid()`) and a
private `face-match-photos` bucket whose policies restrict every user to their own
`<user_id>/` folder. Pictures are read back through short-lived signed URLs.

The file doubles as the migration for collections. Re-running it adds the `collection`
column to an install that predates them and rebuilds the one index to include it. Rows
saved before that point land in a deck named `People`, which is the column's default; the
default also acts as a safety net for any insert that forgets the column.

One thing to read before running it: anonymous Supabase sessions carry a real JWT and so
land in the `authenticated` role, which means `auth.uid() = user_id` alone would not exclude
them. Both the table policy and the storage policies therefore also assert
`auth.jwt() ->> 'is_anonymous' is distinct from 'true'`.

## KruMath integration

A slim bar sits above the app header with the **KruMemory** wordmark, the EN/KM switcher,
**Home**, the **source on GitHub**, **plans and pricing**, and an **account menu** (avatar,
name, email, account settings, sign out). The app was renamed from KruFace but the routes
below were left alone, so nothing on the KruMath side needs to change. Home and pricing replace the current page; the repo opens in a new tab
so a half-finished round is kept. The app's own navigation is untouched. The bar lives in
`src/components/KruMathBar.tsx`.

Because the app is mounted on a subpath rather than a whole domain, the mount point has to
be declared in two places:

- `vite.config.ts` sets both the Vite `base` and the TanStack Router `basepath`, so page
  URLs, asset URLs, and the router all agree.
- The same path is passed to Nitro as `baseURL`, which nests the client build under it so
  `/face-match-memorization/assets/*` resolves to real files in the Worker's asset store.

Both read from a single `basePath` constant. Override it to work at the root instead:

```sh
APP_BASE_PATH=/ npm run dev
```

`vite.config.ts` also enables Nitro's `cloudflare.nodeCompat`, which emits `nodejs_compat`.
TanStack Start keeps the request in an `AsyncLocalStorage` so route `beforeLoad` can read
cookies during SSR; without that flag the storage is a no-op and every request fails.

## Running it

Requires Node.js 20 or newer.

```sh
npm install
cp .env.example .env    # then fill in the Supabase publishable key
npm run dev
```

The dev server serves the app at http://localhost:5173/face-match-memorization/.

### Working on the UI locally

```sh
VITE_AUTH_BYPASS=1 npm run dev   # or set it in .env
```

localhost cannot hold `krumath.com`'s session cookie, so without this every route bounces
to `/sign-in`, which is a **krumath.com** page and not a route in this app. Locally that
redirect dead-ends in a router "not found" error — the `did you mean
/face-match-memorization/sign-in?` hint is TanStack Router reacting to the basepath, not a
real route, so ignore it. The fix is always `VITE_AUTH_BYPASS=1`.

The bypass is gated on `import.meta.env.DEV`, so a production build ignores it. Data
features (saving people, quiz stats) do not work while it is on, because there is no real
Supabase session behind it.

```sh
npm run build     # production build into .output
npm run preview   # build, then serve it locally through workerd
npm run lint      # eslint
npm run format    # prettier
```

`npm run preview` runs the real Worker, so the bypass does **not** apply and it gates like
production (200 with no cookie, then a client-side bounce). Use it to check server-side
auth and asset paths, and `npm run dev` for anything visual.

## Deploying

The build targets Cloudflare Workers as a single Worker plus static assets. `wrangler.jsonc`
declares the Worker name and the two routes that mount it on `krumath.com`:

```sh
npm run deploy
```

That builds and then runs `wrangler deploy` against `.output/server/wrangler.json`. Nitro
merges the `routes` from `wrangler.jsonc` into that generated config, so the routes are
declared once, in the source file.

Environment values are inlined at build time, so `.env` must be present when `npm run build`
runs. Run the SQL file before deploying: until the table exists, saving a face fails.

To exercise the Worker locally before shipping, build and then run it:

```sh
npm run build
npx wrangler dev --config .output/server/wrangler.json
```

## Stack

- React 19 + TypeScript
- [TanStack Start](https://tanstack.com/start) (file-based routing, SSR) with TanStack Query
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — shared KruMath project
- Tailwind CSS v4, shadcn/ui components on Radix primitives
- Vite 8 / Nitro, deployed to Cloudflare Workers

## Layout

```
src/
  components/     shared UI (KruMath bar, auth gate, header, background, item card,
                  collection switcher)
  hooks/          useItems — Supabase-backed store, deck selection, legacy import
  lib/
    auth/         session resolution (server + browser), gate state, sign-in URL
    collections   deck names, whitespace/case normalisation, remembered selection
    i18n/         EN/KM dictionary and provider
    supabase/     browser and server clients, project config
    items-store   table and Storage access, derived stats, legacy import helpers
  routes/         file-based routes: /, /items, /items/add, /quiz
  styles.css      Tailwind theme and custom utilities
supabase/         SQL to run by hand in the Supabase SQL Editor
wrangler.jsonc    Worker name and the Cloudflare routes that mount the app
```
