import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { resolveServerAuth, signInRedirect } from "./lib/auth/session.server";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

/**
 * Block signed-out visitors before any page work happens.
 *
 * This lives in middleware rather than the root route's `beforeLoad` for one reason:
 * the router's own redirect drops the origin, so `redirect({ href })` turns
 * https://krumath.com/sign-in into a redirect to this Worker's host. Returning a raw
 * Response keeps the cross-origin Location intact.
 *
 * A request with no session cookie at all is let through so the browser can check the
 * shared cookie itself; see `resolveServerAuth`.
 */
const authMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request, handlerType }) => {
    if (handlerType !== "router") return next();

    const url = new URL(request.url);
    const outcome = await resolveServerAuth({
      cookieHeader: request.headers.get("cookie") ?? undefined,
      returnTo: `${url.pathname}${url.search}`,
    });

    if (outcome.status === "unauthenticated") return signInRedirect(outcome.signInUrl);
    return next();
  },
);

// TanStack Start wires this up by default, but defining src/start.ts opts out of
// that, so declare it here to keep server functions protected from cross-site
// requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, authMiddleware, csrfMiddleware],
}));
