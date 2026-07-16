import type { FaviconCandidate } from "./favicon";

export interface ParsedIcons {
  candidates: FaviconCandidate[];
  manifestUrl?: string;
}
