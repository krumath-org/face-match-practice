import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, FolderOpen, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CollectionPicker } from "@/components/CollectionPicker";
import { GlowBackground } from "@/components/GlowBackground";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useItems, AuthBypassPersistError } from "@/hooks/use-items";
import { DEV_AUTH_BYPASS } from "@/lib/auth/context";
import { DEFAULT_COLLECTION } from "@/lib/collections";
import {
  collectImagesFromDataTransfer,
  collectImagesFromFileList,
  enforceImageIntakeLimit,
  type ImageIntake,
} from "@/lib/file-intake";
import { labelFromFilename, MAX_BATCH_IMAGES } from "@/lib/filename-label";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/items/add")({
  head: () => ({
    meta: [
      { title: "Add an item — KruMemory" },
      { name: "description", content: "Upload a picture and type what you want to remember." },
      { property: "og:title", content: "Add an item — KruMemory" },
      {
        property: "og:description",
        content: "Upload a picture and type what you want to remember.",
      },
    ],
  }),
  component: AddItemPage,
});

type PendingRow = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  autoName: string;
};

function revokeAll(rows: readonly PendingRow[]) {
  for (const row of rows) URL.revokeObjectURL(row.previewUrl);
}

function rowsFromFiles(files: File[]): PendingRow[] {
  return files.map((file) => {
    const autoName = labelFromFilename(file.name);
    return {
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      name: autoName,
      autoName,
    };
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function AddItemPage() {
  const { addItem, addItems, collections, selectedCollection, ready } = useItems();
  const navigate = useNavigate();
  const t = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingRow[]>([]);
  const dragDepth = useRef(0);

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  /** Last auto-filled label; used so a custom name is kept when the picture changes. */
  const [autoName, setAutoName] = useState("");
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [collection, setCollection] = useState("");
  /** Last auto-filled deck name; a user edit that differs is kept across further uploads. */
  const [autoCollection, setAutoCollection] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ done: number; total: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  pendingRef.current = pending;

  // The remembered deck is only known once the item list arrives, so the field is
  // prefilled after mount — reading it during render would break hydration. Anything
  // the user has already typed wins over the prefill.
  useEffect(() => {
    if (selectedCollection === null) return;
    setCollection((current) => {
      if (current !== "") return current;
      setAutoCollection(selectedCollection);
      return selectedCollection;
    });
  }, [selectedCollection]);

  useEffect(() => {
    const input = folderInputRef.current;
    if (!input) return;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    return () => revokeAll(pendingRef.current);
  }, []);

  const replacePending = (next: PendingRow[]) => {
    setPending((rows) => {
      revokeAll(rows);
      return next;
    });
  };

  const applyIntake = async (intake: ImageIntake) => {
    setFailed(false);
    const limited = enforceImageIntakeLimit(intake);
    if (!limited.ok) {
      setBatchMessage(
        limited.reason === "tooMany"
          ? t("add.batchTooMany", { max: MAX_BATCH_IMAGES })
          : t("add.batchNone"),
      );
      return;
    }

    setBatchMessage(null);

    // Folder names the deck; otherwise fill only when empty or still on the last auto value.
    const shouldAuto = collection.trim() === "" || collection === autoCollection;
    const nextCollection =
      limited.intake.folderName ??
      (shouldAuto ? (selectedCollection ?? DEFAULT_COLLECTION) : null);
    if (nextCollection !== null) {
      setCollection(nextCollection);
      setAutoCollection(nextCollection);
    }

    const { files } = limited.intake;

    if (files.length === 1) {
      const file = files[0]!;
      const label = labelFromFilename(file.name);
      replacePending([]);
      setName((current) => (current.trim() === "" || current === autoName ? label : current));
      setAutoName(label);
      setPhoto(await readFileAsDataUrl(file));
      return;
    }

    setPhoto(null);
    setName("");
    setAutoName("");
    replacePending(rowsFromFiles(files));
  };

  const handleFileList = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    void applyIntake(collectImagesFromFileList(list));
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    void (async () => {
      const intake = await collectImagesFromDataTransfer(event.dataTransfer);
      await applyIntake(intake);
    })();
  };

  const isBatch = pending.length > 1;

  const canSaveSingle =
    Boolean(photo) && name.trim().length > 0 && collection.trim().length > 0 && !saving;
  const canSaveBatch =
    isBatch &&
    pending.every((row) => row.name.trim().length > 0) &&
    collection.trim().length > 0 &&
    !saving;
  const canSave = isBatch ? canSaveBatch : canSaveSingle;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setFailed(false);
    setBatchMessage(null);
    setSaveProgress(null);

    try {
      if (isBatch) {
        const snapshot = pending;
        setSaveProgress({ done: 0, total: snapshot.length });
        const { failedIndexes } = await addItems(
          snapshot.map((row) => ({ name: row.name, photo: row.file })),
          collection,
          (done, total) => setSaveProgress({ done, total }),
        );

        if (failedIndexes.length === 0) {
          replacePending([]);
          await navigate({ to: "/items" });
          return;
        }

        const failedSet = new Set(failedIndexes);
        const failedRows: PendingRow[] = [];
        for (let i = 0; i < snapshot.length; i++) {
          const row = snapshot[i]!;
          if (failedSet.has(i)) failedRows.push(row);
          else URL.revokeObjectURL(row.previewUrl);
        }
        setPending(failedRows);
        setBatchMessage(
          t("add.batchPartialFailed", {
            saved: snapshot.length - failedIndexes.length,
            failed: failedIndexes.length,
          }),
        );
        setSaving(false);
        setSaveProgress(null);
        return;
      }

      if (!photo) return;
      await addItem(name, photo, collection);
      await navigate({ to: "/items" });
    } catch (error) {
      console.error(error);
      if (error instanceof AuthBypassPersistError) {
        setBatchMessage(t("error.authBypass"));
      } else {
        setFailed(true);
      }
      setSaving(false);
      setSaveProgress(null);
    }
  };

  const removePending = (id: string) => {
    const removed = pending.find((row) => row.id === id);
    const remaining = pending.filter((row) => row.id !== id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);

    if (remaining.length === 0) {
      setPending([]);
      return;
    }

    if (remaining.length === 1) {
      const only = remaining[0]!;
      // Collapse to single-photo mode immediately; swap object URL for a data URL after.
      setPhoto(only.previewUrl);
      setName(only.name);
      setAutoName(only.autoName);
      setPending([]);
      void readFileAsDataUrl(only.file).then((dataUrl) => {
        setPhoto(dataUrl);
        URL.revokeObjectURL(only.previewUrl);
      });
      return;
    }

    setPending(remaining);
  };

  const updatePendingName = (id: string, value: string) => {
    setPending((rows) => rows.map((row) => (row.id === id ? { ...row, name: value } : row)));
  };

  const saveLabel = (() => {
    if (saving && saveProgress) {
      return t("add.savingProgress", {
        done: saveProgress.done,
        total: saveProgress.total,
      });
    }
    if (saving) return t("add.saving");
    if (isBatch) return t("add.saveAll");
    return t("add.save");
  })();

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-mist text-ink">
      <GlowBackground />
      <AppHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-5 pb-5 sm:px-6">
        <section className="fade-up glass flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[28px] p-5 ring-1 ring-border sm:p-6">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
            <Link
              to="/items"
              className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground/70 ring-1 ring-border"
            >
              <ArrowLeft className="size-4" />
              {t("add.back")}
            </Link>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave}
              aria-label={saveLabel}
              className="shadow-accent-glow inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground ring-1 ring-accent/40 transition-opacity disabled:opacity-35 disabled:shadow-none"
            >
              <Check className="size-4" />
              {saveLabel}
            </button>
          </div>

          {(batchMessage || failed || DEV_AUTH_BYPASS) && (
            <p role="alert" className="mb-3 shrink-0 text-sm font-medium text-danger">
              {batchMessage ?? (failed ? t("error.saveFailed") : t("error.authBypass"))}
            </p>
          )}

          {isBatch ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {pending.map((row) => (
                  <li
                    key={row.id}
                    className="flex shrink-0 items-center gap-3 rounded-2xl bg-card/70 p-2 ring-1 ring-border"
                  >
                    <img
                      src={row.previewUrl}
                      alt={row.name || t("add.selectedPicture")}
                      className="size-16 shrink-0 rounded-xl object-cover"
                    />
                    <input
                      value={row.name}
                      onChange={(e) => updatePendingName(row.id, e.target.value)}
                      placeholder={t("add.namePlaceholder")}
                      aria-label={t("add.namePlaceholder")}
                      disabled={saving}
                      className="min-w-0 flex-1 rounded-xl bg-mist/40 px-3 py-2.5 text-base font-semibold tracking-tight ring-1 ring-border outline-none placeholder:text-foreground/30 focus:ring-2 focus:ring-accent disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => removePending(row.id)}
                      disabled={saving}
                      aria-label={t("add.removePending")}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-foreground/50 ring-1 ring-border transition-colors hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={saving}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground/60 ring-1 ring-border transition-colors hover:text-foreground"
              >
                <FolderOpen className="size-4" />
                {t("add.uploadFolder")}
              </button>
            </div>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      dragDepth.current += 1;
                      setDragging(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      dragDepth.current = Math.max(0, dragDepth.current - 1);
                      if (dragDepth.current === 0) setDragging(false);
                    }}
                    onDrop={onDrop}
                    aria-label={photo ? t("add.changePicture") : t("add.choosePicture")}
                    // A floor on the height matters: without it the picture is squeezed to a
                    // sliver on short viewports once the two fields below take their space.
                    className={cn(
                      "lift relative flex min-h-[9rem] w-full flex-1 overflow-hidden rounded-[24px] ring-1 transition-shadow",
                      dragging ? "ring-2 ring-accent" : "ring-border",
                    )}
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={t("add.selectedPicture")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center gap-3 bg-card/70 px-4 text-center">
                        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
                          <ImagePlus className="size-6" />
                        </span>
                        <span className="text-sm font-medium text-foreground/50">
                          {t("add.dropHint")}
                        </span>
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {photo ? t("add.changePicture") : t("add.choosePicture")}
                </TooltipContent>
              </Tooltip>

              <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3.5 py-2 text-sm font-medium text-foreground/60 ring-1 ring-border transition-colors hover:text-foreground"
                >
                  <FolderOpen className="size-4" />
                  {t("add.uploadFolder")}
                </button>
              </div>

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
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFileList(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFileList(e.target.files);
              e.target.value = "";
            }}
          />

          <CollectionPicker
            collections={collections}
            value={collection}
            ready={ready}
            onChange={setCollection}
          />
        </section>
      </main>
    </div>
  );
}
