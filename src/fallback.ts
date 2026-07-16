import {
  DEFAULT_GOOGLE_FALLBACK_SIZE,
  GOOGLE_FALLBACK_BASE_URL,
} from "./constants";
import type { FetchOptions } from "./fetch-html";
import { fetchOk } from "./fetch-html";
import type { FaviconCandidate } from "./types";

export async function tryFaviconIco(
  origin: string,
  opts: FetchOptions = {},
): Promise<FaviconCandidate | undefined> {
  const url = new URL("/favicon.ico", origin).toString();
  const response = await fetchOk(url, opts);
  if (!response) return undefined;

  return {
    url,
    source: "favicon.ico",
    format: "image/x-icon",
    isVector: false,
  };
}

export function buildGoogleFallback(
  hostname: string,
  size: number = DEFAULT_GOOGLE_FALLBACK_SIZE,
): FaviconCandidate {
  const url = new URL(GOOGLE_FALLBACK_BASE_URL);
  url.searchParams.set("domain", hostname);
  url.searchParams.set("sz", String(size));

  return {
    url: url.toString(),
    source: "google-fallback",
    format: "image/png",
    isVector: false,
    sizes: { width: size, height: size },
  };
}
