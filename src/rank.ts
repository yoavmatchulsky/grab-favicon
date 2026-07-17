import type { FaviconCandidate, GetFaviconOptions } from "./types";

function score(candidate: FaviconCandidate, options: GetFaviconOptions): number {
  if (options.preferVector && candidate.isVector) return Number.POSITIVE_INFINITY;
  if (candidate.sizes) return candidate.sizes.width * candidate.sizes.height;
  return -1;
}

// Array.prototype.sort is stable, so equal-score candidates keep their
// original discovery order (link-icon -> apple-touch-icon -> manifest).
export function sortByScore(
  candidates: FaviconCandidate[],
  options: GetFaviconOptions = {},
): FaviconCandidate[] {
  return candidates.toSorted((a, b) => score(b, options) - score(a, options));
}

export function pickBest(
  sortedCandidates: FaviconCandidate[],
): FaviconCandidate | undefined {
  return sortedCandidates[0];
}
