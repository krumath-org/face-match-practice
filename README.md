# KruFace

A small app for drilling the names and faces of people you keep mixing up. It runs as a
tool inside [KruMath](https://krumath.com) at
[krumath.com/face-match-memorization](https://krumath.com/face-match-memorization).

Everything lives in the browser — photos, names, and progress are kept in `localStorage`,
so there is no backend, no account, and no data leaving the device.

## How it works

- **Practice** — start a quiz straight from the home page. One portrait at a time.
- **People** — a grid of everyone you have added, with an add button and per-person delete.
- **Add person** — pick a photo and type a name. The photo is stored as a data URL.

Each round builds one of two question types at random:

- **Photo → name**: show a portrait with four name cards.
- **Name → photo**: show a name with four portraits.

Answers and option order are shuffled every time, and you get immediate feedback plus the
correct answer whenever you miss. People you get wrong more often are weighted to come up
more frequently, so weak faces repeat until they stick.

Accuracy is tracked per person and overall, and shown on the home page and during practice.

## KruMath integration

A slim bar sits above the app header with three links back to KruMath: **Home**, the
**source on GitHub**, and **plans and pricing**. Home and pricing replace the current page;
the repo opens in a new tab so a half-finished round is kept. The app's own navigation is
untouched.

The links live in `src/components/KruMathBar.tsx`.

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

## Running it

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

The dev server serves the app at http://localhost:5173/face-match-memorization/.

```sh
npm run build     # production build into .output
npm run preview   # serve the build locally
npm run lint      # eslint
npm run format    # prettier
```

## Deploying

The build targets Cloudflare Workers as a single Worker plus static assets. `wrangler.jsonc`
declares the Worker name and the two routes that mount it on `krumath.com`:

```sh
npm run deploy
```

That builds and then runs `wrangler deploy` against `.output/server/wrangler.json`. Nitro
merges the `routes` from `wrangler.jsonc` into that generated config, so the routes are
declared once, in the source file.

To exercise the Worker locally before shipping, build and then run it:

```sh
npm run build
npx wrangler dev --config .output/server/wrangler.json
```

## Stack

- React 19 + TypeScript
- [TanStack Start](https://tanstack.com/start) (file-based routing, SSR) with TanStack Query
- Tailwind CSS v4, shadcn/ui components on Radix primitives
- Vite 8 / Nitro, deployed to Cloudflare Workers

## Layout

```
src/
  components/     shared UI (KruMath bar, header, background, person card, shadcn primitives)
  hooks/          usePeople — the localStorage-backed store
  lib/            people store, quiz generation, error handling helpers
  routes/         file-based routes: /, /people, /people/add, /quiz
  styles.css      Tailwind theme and custom utilities
wrangler.jsonc    Worker name and the Cloudflare routes that mount the app
```
