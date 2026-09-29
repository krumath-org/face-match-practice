import {
  folderNameFromRelativePath,
  isImageFile,
  MAX_BATCH_IMAGES,
} from "@/lib/filename-label";

export type ImageIntake = {
  files: File[];
  /** Top-level folder name when the intake came from a directory, otherwise null. */
  folderName: string | null;
};

type DirectoryReaderLike = {
  readEntries: (
    success: (entries: FileSystemEntryLike[]) => void,
    error?: (err: DOMException) => void,
  ) => void;
};

type FileSystemEntryLike = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (file: File) => void, error?: (err: DOMException) => void) => void;
  createReader?: () => DirectoryReaderLike;
};

type DataTransferItemWithEntry = DataTransferItem & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

function readAllDirectoryEntries(reader: DirectoryReaderLike): Promise<FileSystemEntryLike[]> {
  return new Promise((resolve, reject) => {
    const collected: FileSystemEntryLike[] = [];
    const readBatch = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(collected);
            return;
          }
          collected.push(...batch);
          readBatch();
        },
        (err) => reject(err),
      );
    };
    readBatch();
  });
}

async function collectFromEntry(entry: FileSystemEntryLike, into: File[]): Promise<void> {
  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) => {
      entry.file!(resolve, reject);
    });
    if (isImageFile(file)) into.push(file);
    return;
  }

  if (entry.isDirectory && entry.createReader) {
    const children = await readAllDirectoryEntries(entry.createReader());
    for (const child of children) {
      await collectFromEntry(child, into);
    }
  }
}

/**
 * Pull image files out of a drag-and-drop payload. Prefers the File System Access-style
 * entry API so a dropped folder expands; falls back to the flat `files` list.
 */
export async function collectImagesFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<ImageIntake> {
  const items = [...dataTransfer.items] as DataTransferItemWithEntry[];
  const entries: FileSystemEntryLike[] = [];
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.() as FileSystemEntryLike | null | undefined;
    if (entry) entries.push(entry);
  }

  if (entries.length > 0) {
    const files: File[] = [];
    let folderName: string | null = null;
    for (const entry of entries) {
      if (entry.isDirectory && folderName === null) folderName = entry.name;
      await collectFromEntry(entry, files);
    }
    return { files, folderName };
  }

  return collectImagesFromFileList(dataTransfer.files);
}

/**
 * Image files from an `<input type="file">`, including `webkitdirectory` picks where the
 * relative path carries the folder name.
 */
export function collectImagesFromFileList(list: FileList | File[]): ImageIntake {
  const all = [...list];
  const files = all.filter(isImageFile);
  let folderName: string | null = null;
  for (const file of all) {
    const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
    const fromPath = folderNameFromRelativePath(relative);
    if (fromPath) {
      folderName = fromPath;
      break;
    }
  }
  return { files, folderName };
}

export type IntakeLimitResult =
  | { ok: true; intake: ImageIntake }
  | { ok: false; reason: "none" | "tooMany"; count: number };

/** Apply the soft batch cap after filtering to images. */
export function enforceImageIntakeLimit(intake: ImageIntake): IntakeLimitResult {
  if (intake.files.length === 0) return { ok: false, reason: "none", count: 0 };
  if (intake.files.length > MAX_BATCH_IMAGES) {
    return { ok: false, reason: "tooMany", count: intake.files.length };
  }
  return { ok: true, intake };
}
