# KruFace

A small personal app for drilling the names and faces of people you keep mixing up.
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

## Running it

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

The dev server runs on http://localhost:5173.

```sh
npm run build     # production build
npm run preview   # serve the build locally
npm run lint      # eslint
npm run format    # prettier
```

## Stack

- React 19 + TypeScript
- [TanStack Start](https://tanstack.com/start) (file-based routing, SSR) with TanStack Query
- Tailwind CSS v4, shadcn/ui components on Radix primitives
- Vite 8 / Nitro, targeting Cloudflare Workers for deploys

## Layout

```
src/
  components/     shared UI (header, background, person card, shadcn primitives)
  hooks/          usePeople — the localStorage-backed store
  lib/            people store, quiz generation, error handling helpers
  routes/         file-based routes: /, /people, /people/add, /quiz
  styles.css      Tailwind theme and custom utilities
```
