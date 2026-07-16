import {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  HEAD_SCAN_WINDOW_BYTES,
  HEAD_STOP_PATTERN,
} from "./constants";

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

// Reads only as much of the response body as it takes to see a closing
// </head> or an opening <body> tag, then cancels the underlying stream so
// the rest of the page (images, scripts, markup) is never downloaded.
// Falls back to a hard byte cap for malformed pages that never close <head>.
async function readUntilHeadEnd(response: Response): Promise<string> {
  const body = response.body;
  if (!body) return response.text();

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (buffer.length < HEAD_SCAN_WINDOW_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      if (HEAD_STOP_PATTERN.test(buffer)) break;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // Stream may already be closed/errored; nothing to clean up.
    }
  }

  return buffer;
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
    const html = await readUntilHeadEnd(response);
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
