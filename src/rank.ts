import type { FaviconCandidate } from "./types.js";

function score(candidate: FaviconCandidate): number {
  if (candidate.isVector) return Number.POSITIVE_INFINITY;
  if (candidate.sizes) return candidate.sizes.width * candidate.sizes.height;
  return -1;
}

// Array.prototype.sort is stable, so equal-score candidates keep their
// original discovery order (link-icon -> apple-touch-icon -> manifest).
export function sortByScore(
  candidates: FaviconCandidate[],
): FaviconCandidate[] {
  return candidates.toSorted((a, b) => score(b) - score(a));
}

export function pickBest(
  candidates: FaviconCandidate[],
): FaviconCandidate | undefined {
  return sortByScore(candidates)[0];
}
