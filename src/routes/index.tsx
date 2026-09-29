import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { GlowBackground } from "@/components/GlowBackground";
import { useItems } from "@/hooks/use-items";
import { useTranslation } from "@/lib/i18n/context";
import { accuracy } from "@/lib/items-store";
import { MIN_ITEMS } from "@/lib/quiz";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KruMemory — Practice remembering anything" },
      {
        name: "description",
        content:
          "Faces, words, symbols, formulas — practise one picture and one name until it sticks.",
      },
      { property: "og:title", content: "KruMemory — Practice remembering anything" },
      {
        property: "og:description",
        content:
          "Faces, words, symbols, formulas — practise one picture and one name until it sticks.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { collections, selectedCollection, selectCollection, visibleItems, stats, loaded } =
    useItems();
  const t = useTranslation();
  const acc = accuracy(stats);
  const ready = visibleItems.length >= MIN_ITEMS;
  const remaining = Math.max(0, MIN_ITEMS - visibleItems.length);
  const latest = visibleItems[visibleItems.length - 1];

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-mist text-ink">
      <GlowBackground />
      <AppHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pb-5 sm:px-6">
        {collections.length > 0 && (
          <div className="mb-2 shrink-0 lg:mb-3">
            <CollectionSwitcher
              collections={collections}
              selected={selectedCollection}
              onSelect={selectCollection}
            />
          </div>
        )}

        <section className="fade-up grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[1.25fr_.75fr] lg:grid-rows-1 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-border">
              <span className={`size-2 rounded-full ${ready ? "bg-accent" : "bg-foreground/25"}`} />
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground/60">
                {!loaded
                  ? t("home.status.loading")
                  : ready
                    ? t("home.status.ready")
                    : t("home.status.needMore", { count: remaining })}
              </span>
            </div>

            <h1 className="max-w-[24ch] text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>

            <p className="max-w-[42ch] text-sm text-foreground/60 text-pretty sm:text-base">
              {t("home.subtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {ready ? (
                <Link
                  to="/quiz"
                  className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40"
                >
                  <Play className="size-4" />
                  {t("home.start")}
                </Link>
              ) : (
                <Link
                  to="/items/add"
                  className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40"
                >
                  <Users className="size-4" />
                  {collections.length === 0 ? t("collections.addFirst") : t("home.addItems")}
                </Link>
              )}

              <div className="glass flex items-center gap-3 rounded-full px-4 py-2.5 ring-1 ring-border">
                <span className="text-sm font-semibold">{acc === null ? "—" : `${acc}%`}</span>
                <span className="h-4 w-px bg-border" />
                <span className="text-sm text-foreground/55">{t("home.accuracy")}</span>
                <span className="h-4 w-px bg-border" />
                <span className="text-sm text-foreground/55">
                  {stats.correct} / {stats.correct + stats.wrong}
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto h-full max-h-[34rem] min-h-0 w-full">
            <div className="absolute -inset-2 -rotate-6 rounded-[26px] bg-card/40 ring-1 ring-border" />
            <div className="lift relative h-full overflow-hidden rounded-[26px] ring-1 ring-border">
              <img
                src={latest ? latest.photo : hero}
                alt={latest?.name ?? ""}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
