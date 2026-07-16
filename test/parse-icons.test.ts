import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseIconLinks } from "../src/parse-icons.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

describe("parseIconLinks", () => {
  it("extracts multiple link icons with sizes", () => {
    const { candidates, manifestUrl } = parseIconLinks(
      loadFixture("head-multi-icons.html"),
      "https://example.com/",
    );
    expect(manifestUrl).toBeUndefined();
    expect(candidates).toHaveLength(3);
    expect(candidates.map((c) => c.url)).toEqual([
      "https://example.com/favicon-16x16.png",
      "https://example.com/favicon-32x32.png",
      "https://example.com/favicon.ico",
    ]);
    expect(candidates[0].sizes).toEqual({ width: 16, height: 16 });
    expect(candidates[2].source).toBe("link-icon");
  });

  it("marks svg icons as vector regardless of sizes attribute", () => {
    const { candidates } = parseIconLinks(
      loadFixture("head-svg-and-png.html"),
      "https://example.com/",
    );
    const svg = candidates.find((c) => c.url.endsWith(".svg"));
    const png = candidates.find((c) => c.url.endsWith(".png"));
    expect(svg?.isVector).toBe(true);
    expect(png?.isVector).toBe(false);
    expect(png?.sizes).toEqual({ width: 256, height: 256 });
  });

  it("classifies apple-touch-icon and apple-touch-icon-precomposed", () => {
    const { candidates } = parseIconLinks(
      loadFixture("head-apple-touch-only.html"),
      "https://example.com/",
    );
    expect(candidates).toHaveLength(2);
    for (const candidate of candidates) {
      expect(candidate.source).toBe("apple-touch-icon");
    }
  });

  it("skips empty placeholder data URIs used to opt out of favicons", () => {
    const { candidates } = parseIconLinks(
      '<link rel="icon" href="data:,">',
      "https://example.com/",
    );
    expect(candidates).toEqual([]);
  });

  it("keeps a data URI icon that actually carries image data", () => {
    const { candidates } = parseIconLinks(
      '<link rel="icon" href="data:image/png;base64,AAAA">',
      "https://example.com/",
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].url).toBe("data:image/png;base64,AAAA");
  });

  it("returns no candidates and no manifest for a head with nothing relevant", () => {
    const { candidates, manifestUrl } = parseIconLinks(
      loadFixture("head-no-icons.html"),
      "https://example.com/",
    );
    expect(candidates).toEqual([]);
    expect(manifestUrl).toBeUndefined();
  });

  it("resolves relative and protocol-relative hrefs and captures the manifest href", () => {
    const { candidates, manifestUrl } = parseIconLinks(
      loadFixture("head-manifest-and-relative.html"),
      "https://example.com/some/page",
    );
    expect(candidates.map((c) => c.url)).toEqual([
      "https://example.com/some/icons/favicon.png",
      "https://cdn.example.com/favicon.png",
    ]);
    expect(manifestUrl).toBe("https://example.com/manifest.json");
  });
});
