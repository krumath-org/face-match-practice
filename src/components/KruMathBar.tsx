import { Link } from "@tanstack/react-router";
import {
  Github,
  HeartHandshake,
  Home,
  LogOut,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth/context";
import { KRUMATH_ORIGIN } from "@/lib/auth/config";
import { useI18n, useTranslation } from "@/lib/i18n/context";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/dictionary";

const PROJECT_REPO = "https://github.com/krumath-org/face-match-practice";

const ITEM_CLASS =
  "grid size-8 place-items-center rounded-full text-foreground/45 transition-colors hover:bg-ink hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/**
 * Slim bar that carries the app's brand (mark + wordmark) and the way back to KruMath:
 * language, the site home, the source repo, pricing, and the signed-in account. Home and
 * pricing replace the current page; the repo opens in a new tab so a half-finished round
 * is kept.
 */
export function KruMathBar() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="relative z-10 shrink-0 border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-1.5 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            aria-hidden="true"
            className="size-8 shrink-0 select-none"
            draggable={false}
          />
          <span className="hidden truncate text-lg font-bold tracking-tight sm:block">
            KruMemory
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <div
            role="group"
            aria-label={t("nav.language")}
            className="flex items-center rounded-full bg-foreground/5 p-0.5 ring-1 ring-border"
          >
            {LOCALES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocale(option)}
                aria-pressed={locale === option}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  locale === option
                    ? "bg-ink text-primary-foreground"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {LOCALE_LABELS[option]}
              </button>
            ))}
          </div>
          <nav aria-label="KruMath" className="flex items-center gap-0.5">
            <BarLink href={`${KRUMATH_ORIGIN}/home`} label={t("toolbar.home")} icon={Home} />
            <BarLink href={PROJECT_REPO} label={t("toolbar.github")} icon={Github} opensInNewTab />
            <BarLink
              href={`${KRUMATH_ORIGIN}/pricing`}
              label={t("toolbar.pricing")}
              icon={HeartHandshake}
            />
            <AccountMenu />
          </nav>
        </div>
      </div>
    </div>
  );
}

function BarLink({
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
          className={ITEM_CLASS}
        >
          <Icon className="size-4" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The signed-in account, mirroring krumath.com's own header: an avatar that opens a menu
 * with account settings and sign-out, rather than a bare sign-out icon. The name, email,
 * and avatar are resolved in the browser, so they may be briefly absent on first paint.
 */
function AccountMenu() {
  const { profile, signOut } = useAuth();
  const t = useTranslation();

  const name = profile?.name ?? profile?.email;
  const initial = name?.trim().charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t("account.label")} className={ITEM_CLASS}>
          <Avatar className="size-6">
            {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-ink text-[11px] font-semibold text-primary-foreground">
              {initial ?? <User className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{name ?? t("account.label")}</p>
          {profile?.email ? (
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`${KRUMATH_ORIGIN}/settings`} className="cursor-pointer">
            <Settings className="size-4" />
            {t("account.settings")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer">
          <LogOut className="size-4" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
