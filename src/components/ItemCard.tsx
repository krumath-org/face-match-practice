import { X } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/context";
import type { Item } from "@/lib/items-store";

export function ItemCard({ item, onDelete }: { item: Item; onDelete: (id: string) => void }) {
  const t = useTranslation();

  return (
    <div className="lift relative flex flex-col rounded-[22px] bg-card/70 p-2.5 ring-1 ring-border">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={t("items.remove", { name: item.name })}
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-card/80 text-foreground/50 ring-1 ring-border transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{t("items.remove", { name: item.name })}</TooltipContent>
      </Tooltip>
      <img
        src={item.photo}
        alt={item.name}
        loading="lazy"
        className="aspect-[4/5] w-full rounded-[16px] object-cover ring-1 ring-border"
      />
      <p className="mt-2 truncate px-1 text-sm font-medium">{item.name}</p>
    </div>
  );
}
