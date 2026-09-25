import { X } from "lucide-react";
import type { Person } from "@/lib/people-store";

export function PersonCard({
  person,
  onDelete,
}: {
  person: Person;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="lift relative flex h-full min-h-0 flex-col rounded-[22px] bg-card/70 p-2.5 ring-1 ring-border">
      <button
        type="button"
        onClick={() => onDelete(person.id)}
        aria-label={`Remove ${person.name}`}
        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-card/80 text-foreground/50 ring-1 ring-border transition-colors hover:text-danger"
      >
        <X className="size-4" />
      </button>
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
