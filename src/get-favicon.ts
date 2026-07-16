import { DEFAULT_TIMEOUT_MS } from "./constants";
import { InvalidFaviconUrlError } from "./errors";
import { extractHead } from "./extract-head";
import { buildGoogleFallback, tryFaviconIco } from "./fallback";
import { fetchPageHtml } from "./fetch-html";
import { fetchManifestIcons } from "./manifest";
import { parseIconLinks } from "./parse-icons";
import { pickBest, sortByScore } from "./rank";
import type {
  FaviconCandidate,
  FaviconImage,
  FaviconResult,
  FetchedHtml,
  GetFaviconOptions,
} from "./types";

function parseAndValidateUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidFaviconUrlError(url);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidFaviconUrlError(url);
  }
  return parsed;
}

async function downloadImage(
  url: string,
  opts: GetFaviconOptions,
): Promise<FaviconImage | undefined> {
  const fetchImpl = opts.fetch ?? fetch;
  try {
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    if (!response.ok) return undefined;
    const arrayBuffer = await response.arrayBuffer();
    const mimeType =
      response.headers.get("content-type") ?? "application/octet-stream";
    return { data: Buffer.from(arrayBuffer), mimeType };
  } catch {
    return undefined;
  }
}

// Gathers candidates from the page head and, if present, its web manifest.
// In fast mode, skips the manifest fetch once the head alone has yielded at
// least one candidate.
async function getCandidates(
  htmlResult: FetchedHtml | null,
  options: GetFaviconOptions,
): Promise<FaviconCandidate[]> {
  if (!htmlResult) return [];

  const head = extractHead(htmlResult.html);
  const { candidates, manifestUrl } = parseIconLinks(head, htmlResult.finalUrl);

  if (options.fast && candidates.length > 0) {
    return candidates;
  }

  if (manifestUrl) {
    const manifestCandidates = await fetchManifestIcons(manifestUrl, options);
    candidates.push(...manifestCandidates);
  }

  return candidates;
}

export async function getFavicon(
  url: string,
  options: GetFaviconOptions = {},
): Promise<FaviconResult> {
  const inputUrl = parseAndValidateUrl(url);

  const htmlResult = await fetchPageHtml(url, options);
  let candidates = await getCandidates(htmlResult, options);

  let best: FaviconCandidate;

  if (candidates.length > 0) {
    if (options.fast) {
      best = candidates[0];
    } else {
      candidates = sortByScore(candidates);
      // Non-null: pickBest only returns undefined for an empty array.
      best = pickBest(candidates) as FaviconCandidate;
    }
  } else {
    const origin = new URL(htmlResult?.finalUrl ?? inputUrl.toString()).origin;
    const icoCandidate = await tryFaviconIco(origin, options);
    best =
      icoCandidate ??
      buildGoogleFallback(inputUrl.hostname, options.googleFallbackSize);
    candidates = [best];
  }

  const result: FaviconResult = {
    url: best.url,
    source: best.source,
    format: best.format,
    isVector: best.isVector,
    sizes: best.sizes,
    candidates,
  };

  if (options.grabImage) {
    result.image = await downloadImage(best.url, options);
  }

  return result;
}
