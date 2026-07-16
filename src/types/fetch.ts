export interface FetchOptions {
  timeoutMs?: number;
  userAgent?: string;
  fetch?: typeof fetch;
}

export interface FetchedHtml {
  html: string;
  finalUrl: string;
}
