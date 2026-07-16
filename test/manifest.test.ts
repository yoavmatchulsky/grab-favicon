import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchManifestIcons } from "../src/manifest.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const manifestJson = readFileSync(
  join(fixturesDir, "manifest-sample.json"),
  "utf-8",
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchManifestIcons", () => {
  it("parses icons, resolves relative src against the manifest URL, and skips monochrome icons", async () => {
    const fetchMock = vi.fn(
      async () => new Response(manifestJson, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const icons = await fetchManifestIcons("https://example.com/manifest.json");

    expect(icons).toHaveLength(3);
    expect(icons.map((i) => i.url)).toEqual([
      "https://example.com/icons/icon-192.png",
      "https://example.com/icons/icon-512.png",
      "https://example.com/icons/relative-icon.png",
    ]);
    expect(icons.some((i) => i.url.includes("mono"))).toBe(false);
  });

  it("returns an empty list on malformed JSON without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not json", { status: 200 })),
    );
    await expect(
      fetchManifestIcons("https://example.com/manifest.json"),
    ).resolves.toEqual([]);
  });

  it("returns an empty list when the manifest request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    await expect(
      fetchManifestIcons("https://example.com/manifest.json"),
    ).resolves.toEqual([]);
  });
});
