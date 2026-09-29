import { Link } from "@tanstack/react-router";

import { useTranslation } from "@/lib/i18n/context";

/** Practice / Items switcher — brand-blue segment control under the KruMath bar. */
export function AppNav({ className }: { className?: string }) {
  const t = useTranslation();

  return (
    <nav
      className={
        className ??
        "flex items-center gap-0.5 rounded-full bg-accent/10 p-1 ring-1 ring-accent/25"
      }
    >
      <Link
        to="/"
        activeOptions={{ exact: true }}
        activeProps={{ className: "bg-accent text-accent-foreground shadow-sm" }}
        inactiveProps={{ className: "text-accent/70 hover:bg-accent/15 hover:text-accent" }}
        className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors lg:px-4 lg:text-sm"
      >
        {t("nav.practice")}
      </Link>
      <Link
        to="/items"
        activeProps={{ className: "bg-accent text-accent-foreground shadow-sm" }}
        inactiveProps={{ className: "text-accent/70 hover:bg-accent/15 hover:text-accent" }}
        className="rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors lg:px-4 lg:text-sm"
      >
        {t("nav.items")}
      </Link>
    </nav>
  );
}
