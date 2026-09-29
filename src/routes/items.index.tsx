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

      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pb-5 sm:px-6">
        {collections.length > 0 && (
          <div className="mb-4 shrink-0">
            <CollectionSwitcher
              collections={collections}
              selected={selectedCollection}
              onSelect={selectCollection}
            />
          </div>
        )}

        <section className="fade-up flex min-h-0 flex-1 flex-col">
          <div className="mb-4 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight">{t("items.title")}</h2>
              <p className="mt-1 truncate text-sm text-foreground/50">
                {!loaded
                  ? "—"
                  : selectedCollection === null
                    ? ""
                    : t("items.count", {
                        count: visibleItems.length,
                        collection: selectedCollection,
                      })}
              </p>
            </div>
            <Link
              to="/items/add"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-border"
            >
              <Plus className="size-4" />
              {t("items.add")}
            </Link>
          </div>

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
            <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
