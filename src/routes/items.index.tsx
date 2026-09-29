import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { GlowBackground } from "@/components/GlowBackground";
import { ItemCard } from "@/components/ItemCard";
import { useItems } from "@/hooks/use-items";
import { useTranslation } from "@/lib/i18n/context";

export const Route = createFileRoute("/items/")({
  head: () => ({
    meta: [
      { title: "Your items — KruMemory" },
      { name: "description", content: "The pictures and names in your personal collection." },
      { property: "og:title", content: "Your items — KruMemory" },
      {
        property: "og:description",
        content: "The pictures and names in your personal collection.",
      },
    ],
  }),
  component: ItemsPage,
});

function ItemsPage() {
  const { collections, selectedCollection, selectCollection, visibleItems, deleteItem, loaded } =
    useItems();
  const t = useTranslation();

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-mist text-ink">
      <GlowBackground />
      <AppHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-3 pb-3 sm:px-6 lg:px-5 lg:pb-5">
        {/* One tools row only — title · deck · add aligned horizontally */}
        <div className="mb-2 flex shrink-0 items-center gap-2 lg:mb-3 lg:gap-3">
          <h2 className="shrink-0 text-lg font-semibold tracking-tight lg:text-xl">
            {t("items.title")}
          </h2>
          {collections.length > 0 && (
            <div className="min-w-0 flex-1">
              <CollectionSwitcher
                collections={collections}
                selected={selectedCollection}
                onSelect={selectCollection}
              />
            </div>
          )}
          {collections.length === 0 && <div className="min-w-0 flex-1" />}
          <Link
            to="/items/add"
            aria-label={t("items.add")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-border lg:gap-2 lg:px-4"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("items.add")}</span>
          </Link>
        </div>

        <section className="fade-up flex min-h-0 flex-1 flex-col">
          {loaded && visibleItems.length === 0 ? (
            <Link
              to="/items/add"
              className="glass grid min-h-0 flex-1 place-items-center gap-3 rounded-[28px] px-6 text-center ring-1 ring-border"
            >
              <div className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <Plus className="size-5" />
              </div>
              <p className="text-sm text-foreground/55">{t("items.empty")}</p>
            </Link>
          ) : (
            <div className="grid min-h-0 flex-1 content-start grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {visibleItems.map((item) => (
                <ItemCard key={item.id} item={item} onDelete={deleteItem} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
