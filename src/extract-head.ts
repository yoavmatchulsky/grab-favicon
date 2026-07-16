import { HEAD_SCAN_WINDOW_BYTES } from "./constants";

const HEAD_TAG_PATTERN = /<head[^>]*>([\s\S]*?)<\/head>/i;

export function extractHead(html: string): string {
  const window = html.slice(0, HEAD_SCAN_WINDOW_BYTES);
  const match = window.match(HEAD_TAG_PATTERN);
  return match ? match[1] : window;
}
