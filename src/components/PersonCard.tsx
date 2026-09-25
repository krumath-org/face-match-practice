import { X } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n/context";
import type { Person } from "@/lib/people-store";

export function PersonCard({
  person,
  onDelete,
}: {
  person: Person;
  onDelete: (id: string) => void;
}) {
  const t = useTranslation();

  return (
    <div className="lift relative flex h-full min-h-0 flex-col rounded-[22px] bg-card/70 p-2.5 ring-1 ring-border">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onDelete(person.id)}
            aria-label={t("people.remove", { name: person.name })}
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-card/80 text-foreground/50 ring-1 ring-border transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">{t("people.remove", { name: person.name })}</TooltipContent>
      </Tooltip>
      <img
        src={person.photo}
        alt={person.name}
        loading="lazy"
        className="min-h-0 w-full flex-1 rounded-[16px] object-cover ring-1 ring-border"
      />
      <p className="mt-2 shrink-0 truncate px-1 text-sm font-medium">{person.name}</p>
    </div>
  );
}
