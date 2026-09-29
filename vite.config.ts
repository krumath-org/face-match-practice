import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/**
 * KruMath serves this app from a subpath, so the Vite base (every asset URL) and
 * the router basepath have to agree. Run `APP_BASE_PATH=/ npm run dev` to work at
 * the root instead.
 */
function normalizeBasePath(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * The mount point is frozen at the face-era slug even though the app is now KruMemory:
 * it is a live public URL, and changing it would break every existing link and bookmark.
 * The same value is repeated in `wrangler.jsonc` and in the KruMath handoff doc.
 */
const basePath = normalizeBasePath(process.env["APP_BASE_PATH"] ?? "/face-match-memorization");
const viteBase = basePath === "/" ? "/" : `${basePath}/`;

export default defineConfig(({ command }) => ({
  base: viteBase,
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": srcDir },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      router: { basepath: basePath },
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    // Nitro only wraps the production build. In dev we let the TanStack Start
    // plugin serve the app so `npm run dev` doesn't need a Cloudflare runtime.
    ...(command === "build"
      ? [
          nitro({
            preset: "cloudflare-module",
            // Nitro needs the mount point too: it nests the client build under the
            // base so /face-match-memorization/assets/* resolves to a real file.
            baseURL: viteBase,
            // TanStack Start keeps the request in an AsyncLocalStorage so route
            // `beforeLoad` can read cookies during SSR. That needs nodejs_compat,
            // which the cloudflare-module preset only emits when this is on.
            cloudflare: { nodeCompat: true },
          }),
        ]
      : []),
    react(),
  ],
}));
