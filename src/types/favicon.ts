export type FaviconSource =
  | "link-icon"
  | "apple-touch-icon"
  | "manifest"
  | "favicon.ico"
  | "google-fallback";

export interface FaviconSize {
  width: number;
  height: number;
}

export interface FaviconCandidate {
  url: string;
  source: FaviconSource;
  rel?: string;
  format?: string;
  isVector: boolean;
  sizes?: FaviconSize;
}

export interface FaviconImage {
  data: Buffer;
  mimeType: string;
}

export interface FaviconResult {
  url: string;
  source: FaviconSource;
  format?: string;
  isVector: boolean;
  sizes?: FaviconSize;
  candidates: FaviconCandidate[];
  image?: FaviconImage;
}

export interface GetFaviconOptions {
  grabImage?: boolean;
  timeoutMs?: number;
  userAgent?: string;
  googleFallbackSize?: number;
  fetch?: typeof fetch;
  // Skip ranking and return the first candidate found instead of the best
  // one. The manifest fetch is skipped too, but only once the page head
  // has already yielded a candidate. Trades accuracy for speed.
  fast?: boolean;
  preferVector?: boolean;
}
