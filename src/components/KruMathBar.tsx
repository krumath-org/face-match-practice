import { Github, HeartHandshake, Home, type LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const KRUMATH_HOME = "https://krumath.com/home";
const KRUMATH_PRICING = "https://krumath.com/pricing";
const PROJECT_REPO = "https://github.com/sokna492-km/face-match-practice";

/**
 * Slim bar that ties the app back to KruMath. Home and Plans replace the current
 * page; the repo opens in a new tab so a half-finished practice round is kept.
 */
export function KruMathBar() {
  return (
    <div className="relative z-10 shrink-0 border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-1.5 sm:px-6">
        <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-foreground/40">
          KruMath
        </span>
        <nav aria-label="KruMath" className="flex items-center gap-0.5">
          <BarButton href={KRUMATH_HOME} label="KruMath home" icon={Home} />
          <BarButton href={PROJECT_REPO} label="Source on GitHub" icon={Github} opensInNewTab />
          <BarButton href={KRUMATH_PRICING} label="Plans and pricing" icon={HeartHandshake} />
        </nav>
      </div>
    </div>
  );
}

function BarButton({
  href,
  label,
  icon: Icon,
  opensInNewTab,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  opensInNewTab?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          aria-label={label}
          {...(opensInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="grid size-8 place-items-center rounded-full text-foreground/45 transition-colors hover:bg-ink hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon className="size-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
