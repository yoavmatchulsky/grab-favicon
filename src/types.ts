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
  timeoutMs?: number;
  userAgent?: string;
  fetchImage?: boolean;
  googleFallbackSize?: number;
  fetch?: typeof fetch;
}
