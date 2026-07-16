import { parse } from "node-html-parser";
import {
  inferFormatFromUrl,
  isUsableIconUrl,
  isVectorFormat,
  parseSizes,
  resolveUrl,
} from "./icon-utils";
import type { FaviconCandidate, FaviconSource, ParsedIcons } from "./types";

function classifyRel(rel: string): FaviconSource | "manifest" | undefined {
  const tokens = rel.split(/\s+/);
  if (tokens.includes("icon") || tokens.includes("shortcut"))
    return "link-icon";
  if (tokens.includes("mask-icon")) return "link-icon";
  if (
    tokens.includes("apple-touch-icon") ||
    tokens.includes("apple-touch-icon-precomposed")
  ) {
    return "apple-touch-icon";
  }
  if (tokens.includes("manifest")) return "manifest";
  return undefined;
}

export function parseIconLinks(headHtml: string, baseUrl: string): ParsedIcons {
  const root = parse(headHtml, { lowerCaseTagName: true });
  const candidates: FaviconCandidate[] = [];
  let manifestUrl: string | undefined;

  for (const link of root.querySelectorAll("link")) {
    const relAttr = link.getAttribute("rel");
    const href = link.getAttribute("href");
    if (!relAttr || !href) continue;

    const rel = relAttr.trim().toLowerCase();
    const kind = classifyRel(rel);
    if (!kind) continue;

    const resolved = resolveUrl(href, baseUrl);
    if (!resolved || !isUsableIconUrl(resolved)) continue;

    if (kind === "manifest") {
      manifestUrl = resolved;
      continue;
    }

    const typeAttr = link.getAttribute("type")?.trim();
    const format = typeAttr?.includes("/")
      ? typeAttr
      : inferFormatFromUrl(resolved);
    const isMaskIcon = rel.split(/\s+/).includes("mask-icon");
    const isVector = isMaskIcon || isVectorFormat(format, resolved);

    candidates.push({
      url: resolved,
      source: kind,
      rel,
      format,
      isVector,
      sizes: parseSizes(link.getAttribute("sizes")),
    });
  }

  return { candidates, manifestUrl };
}
