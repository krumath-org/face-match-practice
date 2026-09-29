import { Check, Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  collectionNames,
  matchCollectionName,
  normalizeCollectionName,
  type CollectionSummary,
} from "@/lib/collections";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

/**
 * Choosing which deck an item is filed under used to be a bare text box backed by the
 * browser's own suggestion list: it asked the user to type a deck name from memory and,
 * on phones, often showed no suggestions at all.
 *
 * The answer is nearly always "the deck I was just looking at", so the decks that exist
 * are buttons and typing is kept for a genuinely new name. The names are user data and
 * are never translated; only the labels around them are.
 */
export function CollectionPicker({
  collections,
  value,
  ready,
  onChange,
}: {
  collections: readonly CollectionSummary[];
  /** The deck the item will be filed under. Empty means nothing has been chosen yet. */
  value: string;
  /** False until the deck list has arrived, when an empty list still means "unknown". */
  ready: boolean;
  onChange: (name: string) => void;
}) {
  const t = useTranslation();
  const [naming, setNaming] = useState(false);
  /** Set only when the user asked for the name box, so the page never steals focus. */
  const [focusName, setFocusName] = useState(false);
  /** True after the user opens the name box on purpose, so an auto-fill close does not fight them. */
  const userOpenedNaming = useRef(false);

  const typed = normalizeCollectionName(value);

  /** The chosen name when it is a deck that already exists, otherwise null. */
  const chosen =
    typed === ""
      ? null
      : (collections.find(
          (entry) => entry.name.toLocaleLowerCase() === typed.toLocaleLowerCase(),
        ) ?? null);

  /** The existing spelling of what has been typed, when it is a deck already in the list. */
  const duplicate = typed === "" ? null : matchCollectionName(collectionNames(collections), typed);

  // A brand-new account has no decks to choose from, so typing a name is the only way
  // forward — but only while nothing has been chosen yet.
  useEffect(() => {
    if (!ready) return;
    if (collections.length === 0 && typed === "") {
      userOpenedNaming.current = false;
      setNaming(true);
    }
  }, [ready, collections.length, typed]);

  // Parent auto-filled a deck (folder name or default) — treat it as chosen.
  useEffect(() => {
    if (typed !== "" && !userOpenedNaming.current) setNaming(false);
  }, [typed]);

  const confirmName = () => {
    if (typed === "") return;
    // Reuse the existing spelling, so "french" joins "French" rather than quietly
    // creating a near-identical deck beside it.
    onChange(duplicate ?? typed);
    userOpenedNaming.current = false;
    setNaming(false);
  };

  const openNaming = () => {
    userOpenedNaming.current = true;
    setFocusName(true);
    setNaming(true);
  };

  return (
    <div className="mt-3 shrink-0">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-foreground/45">
        {t("add.collectionLabel")}
      </p>

      {naming ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus={focusName}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              // Enter belongs to the name box here: accepting a deck name must not also
              // submit the whole form, which is what the old field did.
              if (event.key === "Enter") {
                event.preventDefault();
                confirmName();
              } else if (event.key === "Escape") {
                userOpenedNaming.current = false;
                setNaming(false);
              }
            }}
            placeholder={t("add.collectionPlaceholder")}
            aria-label={t("add.collectionNew")}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-2xl bg-card/70 px-5 py-3 text-base font-medium tracking-tight ring-1 ring-border outline-none placeholder:text-foreground/30 focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={confirmName}
            disabled={typed === ""}
            aria-label={t("add.collectionConfirm")}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground ring-1 ring-accent/40 transition-opacity disabled:opacity-35"
          >
            <Check className="size-4" />
          </button>
          {/* Nothing to go back to on a brand-new account, so the escape hatch is hidden. */}
          {collections.length > 0 && (
            <button
              type="button"
              onClick={() => {
                userOpenedNaming.current = false;
                setNaming(false);
              }}
              aria-label={t("add.collectionCancel")}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-card/70 text-foreground/60 ring-1 ring-border transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {collections.map((entry) => {
            const active = chosen?.name === entry.name;
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => onChange(entry.name)}
                aria-pressed={active}
                title={entry.name}
                className={cn(
                  "inline-flex max-w-[14rem] items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium ring-1 transition-colors",
                  active
                    ? "bg-ink text-primary-foreground ring-ink"
                    : "bg-card/70 text-foreground/60 ring-border hover:text-foreground",
                )}
              >
                <span className="truncate">{entry.name}</span>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    active ? "text-primary-foreground/60" : "text-foreground/35",
                  )}
                >
                  {entry.itemCount}
                </span>
              </button>
            );
          })}

          {/* A name that is not a deck yet still needs to look chosen once the box closes. */}
          {chosen === null && typed !== "" && (
            <span className="inline-flex max-w-[14rem] items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-primary-foreground ring-1 ring-ink">
              <span className="truncate">{typed}</span>
            </span>
          )}

          <button
            type="button"
            onClick={openNaming}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-foreground/25 px-3.5 py-2 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground"
          >
            {typed !== "" ? (
              <>
                <Pencil className="size-4" />
                {t("add.collectionEdit")}
              </>
            ) : (
              <>
                <Plus className="size-4" />
                {t("add.collectionNew")}
              </>
            )}
          </button>
        </div>
      )}

      {duplicate !== null ? (
        <p className="mt-1.5 text-xs text-foreground/50">
          {t("add.collectionExisting", { collection: duplicate })}
        </p>
      ) : (
        !naming &&
        typed === "" && (
          <p className="mt-1.5 text-xs text-foreground/50">{t("add.collectionRequired")}</p>
        )
      )}
    </div>
  );
}
