import type { FetchOptions } from "./fetch-html";
import { fetchOk } from "./fetch-html";
import {
  inferFormatFromUrl,
  isUsableIconUrl,
  isVectorFormat,
  parseSizes,
  resolveUrl,
} from "./icon-utils";
import type { FaviconCandidate } from "./types";

interface ManifestIcon {
  src?: string;
  sizes?: string;
  type?: string;
  purpose?: string;
}

interface WebAppManifest {
  icons?: ManifestIcon[];
}

export async function fetchManifestIcons(
  manifestUrl: string,
  opts: FetchOptions = {},
): Promise<FaviconCandidate[]> {
  const response = await fetchOk(manifestUrl, opts);
  if (!response) return [];

  let manifest: WebAppManifest;
  try {
    manifest = (await response.json()) as WebAppManifest;
  } catch {
    return [];
  }

  if (!Array.isArray(manifest.icons)) return [];

  const baseUrl = response.url || manifestUrl;
  const candidates: FaviconCandidate[] = [];

  for (const icon of manifest.icons) {
    if (!icon.src) continue;
    if (icon.purpose?.trim().toLowerCase() === "monochrome") continue;

    const resolved = resolveUrl(icon.src, baseUrl);
    if (!resolved || !isUsableIconUrl(resolved)) continue;

    const format = icon.type?.trim() || inferFormatFromUrl(resolved);
    const isVector = isVectorFormat(format, resolved);

    candidates.push({
      url: resolved,
      source: "manifest",
      format,
      isVector,
      sizes: parseSizes(icon.sizes),
    });
  }

  return candidates;
}
