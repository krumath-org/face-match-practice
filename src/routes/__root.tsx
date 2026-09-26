import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createIsomorphicFn } from "@tanstack/react-start";

import { AuthGate } from "../components/AuthGate";
import { TooltipProvider } from "../components/ui/tooltip";
import { AuthProvider, type AuthState } from "../lib/auth/context";
import type { ServerAuthOutcome } from "../lib/auth/session.server";
import { LocaleProvider } from "../lib/i18n/context";
import appCss from "../styles.css?url";

// Public assets sit under the app's mount point, so links to them can't be absolute.
const baseUrl = import.meta.env.BASE_URL;

/**
 * The server branch reads the session cookie, so it can only exist in the server bundle.
 * Declaring the split here rather than guarding a dynamic import with `import.meta.env.SSR`
 * matters: the guard is a runtime check, while the import graph is walked statically, so a
 * bare `.server` import is rejected before the guard is ever reached.
 */
const resolveRouteAuth = createIsomorphicFn()
  .server(async (): Promise<ServerAuthOutcome> => {
    const { resolveServerAuth } = await import("../lib/auth/session.server");
    return resolveServerAuth();
  })
  .client(async (): Promise<ServerAuthOutcome> => ({ status: "unknown" }));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href={baseUrl}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KruFace" },
      { name: "description", content: "Practice remembering faces and names." },
      { property: "og:title", content: "KruFace" },
      { property: "og:description", content: "Practice remembering faces and names." },
      { property: "og:type", content: "website" },
      { property: "twitter:card", content: "summary_large_image" },
      // Private tool: keep it out of search results, including the pre-auth shell.
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        // Kantumruy Pro is the Khmer face KruMath standardises on; Space Grotesk has no
        // Khmer glyphs, so the browser falls through to it for Khmer text only.
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Kantumruy+Pro:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: `${baseUrl}favicon.svg`, type: "image/svg+xml" },
      { rel: "icon", href: `${baseUrl}favicon.ico`, sizes: "any", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: `${baseUrl}favicon.png` },
    ],
  }),
  // The gate opens here so every route is covered, on the server and in the browser.
  // Request middleware has already redirected anyone definitively signed out; this only
  // needs to decide what to render.
  beforeLoad: async (): Promise<{ auth: AuthState }> => {
    const outcome = await resolveRouteAuth();

    if (outcome.status === "authenticated") {
      // Only the id is vouched for here; the toolbar's name and avatar are filled in
      // client-side so the email never lands in the SSR payload.
      return {
        auth: { status: "authenticated", userId: outcome.userId, profile: null },
      };
    }
    // No cookie, or one the server cannot vouch for: the browser decides, since the
    // session may live in its own storage rather than a cookie. On the client this is
    // always "unknown", so a cookie session settles on the first paint instead of
    // flashing a loading state.
    return { auth: { status: "pending", userId: null, profile: null } };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { auth } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider initial={auth}>
          <AuthGate>
            <TooltipProvider delayDuration={200} skipDelayDuration={300}>
              <Outlet />
            </TooltipProvider>
          </AuthGate>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
