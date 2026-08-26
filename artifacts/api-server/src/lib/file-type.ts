/**
 * Identifies uploaded images by their actual bytes.
 *
 * The browser-supplied MIME type and filename are attacker-controlled, so they
 * are ignored entirely: the extension written to disk comes from this sniffer.
 * SVG is deliberately unsupported — it is a script-bearing document, and served
 * from our own origin it would be stored XSS.
 */

export type ImageKind = { mime: string; ext: string };

export function sniffImage(buffer: Buffer): ImageKind | null {
  const magic = (offset: number, ...bytes: number[]): boolean =>
    bytes.every((b, i) => buffer[offset + i] === b);

  if (magic(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { mime: "image/png", ext: ".png" };
  }
  if (magic(0, 0xff, 0xd8, 0xff)) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  if (magic(0, 0x47, 0x49, 0x46, 0x38)) {
    return { mime: "image/gif", ext: ".gif" };
  }
  if (magic(0, 0x52, 0x49, 0x46, 0x46) && magic(8, 0x57, 0x45, 0x42, 0x50)) {
    return { mime: "image/webp", ext: ".webp" };
  }
  // AVIF and other ISO-BMFF images: "ftyp" box with an avif/avis brand.
  if (magic(4, 0x66, 0x74, 0x79, 0x70)) {
    const brand = buffer.subarray(8, 12).toString("latin1");
    if (brand === "avif" || brand === "avis") {
      return { mime: "image/avif", ext: ".avif" };
    }
  }
  return null;
}
