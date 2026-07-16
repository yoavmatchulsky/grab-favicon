import { DEFAULT_TIMEOUT_MS, DEFAULT_USER_AGENT } from "./constants.js";

export interface FetchOptions {
  timeoutMs?: number;
  userAgent?: string;
  fetch?: typeof fetch;
}

export interface FetchedHtml {
  html: string;
  finalUrl: string;
}

async function fetchWithTimeout(
  url: string,
  opts: FetchOptions,
  headers: Record<string, string>,
): Promise<Response | null> {
  const fetchImpl = opts.fetch ?? fetch;
  try {
    const response = await fetchImpl(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      headers,
    });
    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

export async function fetchPageHtml(
  url: string,
  opts: FetchOptions = {},
): Promise<FetchedHtml | null> {
  const response = await fetchWithTimeout(url, opts, {
    "User-Agent": opts.userAgent ?? DEFAULT_USER_AGENT,
    Accept: "text/html,application/xhtml+xml",
  });
  if (!response) return null;
  try {
    const html = await response.text();
    return { html, finalUrl: response.url || url };
  } catch {
    return null;
  }
}

export async function fetchOk(
  url: string,
  opts: FetchOptions = {},
): Promise<Response | null> {
  return fetchWithTimeout(url, opts, {
    "User-Agent": opts.userAgent ?? DEFAULT_USER_AGENT,
  });
}
