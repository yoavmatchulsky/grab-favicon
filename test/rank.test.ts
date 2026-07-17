import { describe, expect, it } from "vitest";
import { pickBest, sortByScore } from "../src/rank";
import type { FaviconCandidate } from "../src/types";

function candidate(overrides: Partial<FaviconCandidate>): FaviconCandidate {
  return {
    url: "https://example.com/icon.png",
    source: "link-icon",
    isVector: false,
    ...overrides,
  };
}

describe("pickBest", () => {
  it("returns undefined for an empty list", () => {
    expect(pickBest([])).toBeUndefined();
  });
});

describe("sortByScore", () => {
  it("prefers a regular raster icon over a svg icon", () => {
    const svg = candidate({ url: "a.svg", isVector: true });
    const bigPng = candidate({
      url: "b.png",
      isVector: false,
      sizes: { width: 512, height: 512 },
    });
    expect(sortByScore([svg, bigPng])).toEqual([bigPng, svg]);
  });

  it("prefers a known size over an unknown size", () => {
    const unknown = candidate({ url: "unknown.png" });
    const known = candidate({
      url: "known.png",
      sizes: { width: 32, height: 32 },
    });
    expect(sortByScore([unknown, known])).toEqual([known, unknown]);
  });

  it("breaks ties by discovery order", () => {
    const first = candidate({ url: "first.png", source: "link-icon" });
    const second = candidate({ url: "second.png", source: "apple-touch-icon" });
    expect(sortByScore([first, second])).toEqual([first, second]);
  });

  it("sorts candidates best-first without mutating the input", () => {
    const input = [
      candidate({ url: "small.png", sizes: { width: 16, height: 16 } }),
      candidate({ url: "svg.svg", isVector: true }),
      candidate({ url: "large.png", sizes: { width: 256, height: 256 } }),
    ];
    const sorted = sortByScore(input, {});
    expect(sorted.map((c) => c.url)).toEqual([
      "large.png",
      "small.png",
      "svg.svg",
    ]);
    expect(input[0].url).toBe("small.png");
  });

  it("sorts candidates best-first and prefer svg", () => {
    const input = [
      candidate({ url: "small.png", sizes: { width: 16, height: 16 } }),
      candidate({ url: "svg.svg", isVector: true }),
      candidate({ url: "large.png", sizes: { width: 256, height: 256 } }),
    ];
    const sorted = sortByScore(input, { preferVector: true });
    expect(sorted.map((c) => c.url)).toEqual([
      "svg.svg",
      "large.png",
      "small.png",
    ]);
    expect(input[0].url).toBe("small.png");
  });
});
