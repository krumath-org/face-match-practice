import type { CollectionSummary } from "@/lib/collections";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

/**
 * The deck picker. Decks are what keep subjects apart, so this is the control that
 * decides what the item list and the quiz are looking at.
 *
 * The names inside it are user data and are never translated; only the group label is.
 */
export function CollectionSwitcher({
  collections,
  selected,
  onSelect,
}: {
  collections: readonly CollectionSummary[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const t = useTranslation();

  // Nothing to switch between until the first item exists; the page shows its own
  // "add your first item" call to action instead.
  if (collections.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={t("collections.label")}
      className="glass flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 ring-1 ring-border"
    >
      {collections.map((collection) => {
        const active = collection.name === selected;
        return (
          <button
            key={collection.name}
            type="button"
            onClick={() => onSelect(collection.name)}
            aria-pressed={active}
            title={collection.name}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-ink text-primary-foreground"
                : "text-foreground/55 hover:text-foreground",
            )}
          >
            <span className="max-w-[10rem] truncate">{collection.name}</span>
            <span
              className={cn(
                "text-xs tabular-nums",
                active ? "text-primary-foreground/60" : "text-foreground/35",
              )}
            >
              {collection.itemCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
