import { Link } from "@tanstack/react-router";

import { KruMathBar } from "@/components/KruMathBar";
import { useTranslation } from "@/lib/i18n/context";

export function AppHeader() {
  const t = useTranslation();

  return (
    <div className="shrink-0">
      <KruMathBar />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-end px-5 py-4 sm:px-6">
        <nav className="glass flex items-center gap-1 rounded-full p-1 ring-1 ring-border">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-ink text-primary-foreground" }}
            inactiveProps={{ className: "text-foreground/55 hover:text-foreground" }}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
          >
            {t("nav.practice")}
          </Link>
          <Link
            to="/people"
            activeProps={{ className: "bg-ink text-primary-foreground" }}
            inactiveProps={{ className: "text-foreground/55 hover:text-foreground" }}
            className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
          >
            {t("nav.people")}
          </Link>
        </nav>
      </header>
    </div>
  );
}
