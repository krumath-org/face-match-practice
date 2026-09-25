import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { GlowBackground } from "@/components/GlowBackground";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePeople } from "@/hooks/use-people";
import { useTranslation } from "@/lib/i18n/context";

export const Route = createFileRoute("/people/add")({
  head: () => ({
    meta: [
      { title: "Add a person — KruFace" },
      { name: "description", content: "Upload a photo and enter a name to start practicing." },
      { property: "og:title", content: "Add a person — KruFace" },
      {
        property: "og:description",
        content: "Upload a photo and enter a name to start practicing.",
      },
    ],
  }),
  component: AddPersonPage,
});

function AddPersonPage() {
  const { addPerson } = usePeople();
  const navigate = useNavigate();
  const t = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const canSave = Boolean(photo) && name.trim().length > 0 && !saving;

  const save = async () => {
    if (!canSave || !photo) return;
    setSaving(true);
    setFailed(false);
    try {
      // Uploading to Storage and inserting the row both happen here, so a failure
      // keeps the form intact instead of losing the chosen photo.
      await addPerson(name, photo);
      await navigate({ to: "/people" });
    } catch (error) {
      console.error(error);
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-mist text-ink">
      <GlowBackground />
      <AppHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-5 pb-5 sm:px-6">
        <section className="fade-up glass flex min-h-0 flex-1 flex-col rounded-[28px] p-5 ring-1 ring-border sm:p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <Link
              to="/people"
              className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground/70 ring-1 ring-border"
            >
              <ArrowLeft className="size-4" />
              {t("add.back")}
            </Link>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave}
              aria-label={t("add.save")}
              className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40 transition-opacity disabled:opacity-35 disabled:shadow-none"
            >
              <Check className="size-4" />
              {saving ? t("add.saving") : t("add.save")}
            </button>
          </div>

          {failed && (
            <p role="alert" className="mb-3 shrink-0 text-sm font-medium text-danger">
              {t("error.saveFailed")}
            </p>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label={photo ? t("add.changePhoto") : t("add.choosePhoto")}
                className="lift relative flex min-h-0 w-full flex-1 overflow-hidden rounded-[24px] ring-1 ring-border"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={t("add.selectedPortrait")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center gap-3 bg-card/70">
                    <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
                      <ImagePlus className="size-6" />
                    </span>
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {photo ? t("add.changePhoto") : t("add.choosePhoto")}
            </TooltipContent>
          </Tooltip>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
            }}
            placeholder={t("add.namePlaceholder")}
            aria-label={t("add.namePlaceholder")}
            className="mt-4 w-full shrink-0 rounded-2xl bg-card/70 px-5 py-3.5 text-xl font-semibold tracking-tight ring-1 ring-border outline-none placeholder:text-foreground/30 focus:ring-2 focus:ring-accent"
          />
        </section>
      </main>
    </div>
  );
}
