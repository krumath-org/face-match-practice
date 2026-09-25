import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth/context";
import { useTranslation } from "@/lib/i18n/context";
import { GlowBackground } from "@/components/GlowBackground";

/**
 * Nothing inside the app renders until a KruMath account is confirmed, so a signed-out
 * visitor never sees a flash of the tool before being redirected to sign-in.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const t = useTranslation();

  if (status !== "authenticated") {
    return (
      <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-mist text-ink">
        <GlowBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="size-6 animate-spin rounded-full border-2 border-foreground/20 border-t-accent"
          />
          <p className="text-sm text-foreground/55" role="status">
            {t("auth.checking")}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
