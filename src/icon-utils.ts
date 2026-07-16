import type { FaviconSize } from "./types";

const EXTENSION_MIME_MAP: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
};

export function inferFormatFromUrl(url: string): string | undefined {
  const match = url.match(/\.([a-z0-9]+)(?:[?#]|$)/i);
  if (!match) return undefined;
  return EXTENSION_MIME_MAP[match[1].toLowerCase()];
}

export function isVectorFormat(
  format: string | undefined,
  url: string,
): boolean {
  if (format === "image/svg+xml") return true;
  return /\.svg(?:[?#]|$)/i.test(url);
}

export function parseSizes(
  sizesAttr: string | null | undefined,
): FaviconSize | undefined {
  if (!sizesAttr) return undefined;
  const tokens = sizesAttr.trim().toLowerCase().split(/\s+/);
  let best: FaviconSize | undefined;
  for (const token of tokens) {
    const match = token.match(/^(\d+)x(\d+)$/);
    if (!match) continue;
    const width = Number.parseInt(match[1], 10);
    const height = Number.parseInt(match[2], 10);
    if (!best || width * height > best.width * best.height) {
      best = { width, height };
    }
  }
  return best;
}

export function resolveUrl(href: string, baseUrl: string): string | undefined {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return undefined;
  }
}

// Some sites use an empty/placeholder data URI (e.g. `data:,`) to explicitly
// opt out of favicon requests. Treat those as unusable rather than as a real
// (if tiny) candidate.
export function isUsableIconUrl(url: string): boolean {
  if (!url.startsWith("data:")) return true;
  const match = url.match(/^data:([^,;]*)(?:;[^,]*)?,(.*)$/s);
  if (!match) return false;
  const [, mime, data] = match;
  return mime.startsWith("image/") && data.length > 0;
}
