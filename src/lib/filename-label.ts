/** Soft cap so a huge folder cannot flood memory or Storage in one go. */
export const MAX_BATCH_IMAGES = 100;

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif)$/i;

/** True when the browser reports an image MIME, or the name ends in a common image extension. */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

/**
 * Turns a file name into a recall label: strip path and extension, then treat `_` and `-`
 * as spaces. Empty after cleanup stays empty so the form can still require a typed name.
 */
export function labelFromFilename(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

/** First segment of a relative path, used as the deck name when a folder is picked. */
export function folderNameFromRelativePath(relativePath: string): string | null {
  const parts = relativePath.split(/[/\\]/).filter(Boolean);
  return parts.length >= 2 ? parts[0]! : null;
}
