import { describe, expect, it, vi } from "vitest";
import { InvalidFaviconUrlError } from "../src/errors.js";
import { getFavicon } from "../src/get-favicon.js";

type Route = (url: string) => Response | null;

function makeFetch(routes: Route[]): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const route of routes) {
      const response = route(url);
      if (response) return response;
    }
    return new Response("", { status: 404 });
  }) as unknown as typeof fetch;
}

function htmlPage(head: string): Response {
  return new Response(`<html><head>${head}</head><body></body></html>`, {
    status: 200,
  });
}

describe("getFavicon", () => {
  it("throws InvalidFaviconUrlError for a non-http(s) or malformed URL", async () => {
    await expect(getFavicon("not a url")).rejects.toThrow(
      InvalidFaviconUrlError,
    );
    await expect(getFavicon("ftp://example.com/")).rejects.toThrow(
      InvalidFaviconUrlError,
    );
  });

  it("picks the largest declared link icon among several sizes", async () => {
    const fetchImpl = makeFetch([
      (url) =>
        url === "https://example.com/"
          ? htmlPage(
              '<link rel="icon" href="/small.png" sizes="16x16" type="image/png">' +
                '<link rel="icon" href="/big.png" sizes="256x256" type="image/png">',
            )
          : null,
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
    });
    expect(result.url).toBe("https://example.com/big.png");
    expect(result.source).toBe("link-icon");
    expect(result.candidates).toHaveLength(2);
  });

  it("prefers an SVG icon over a larger PNG icon", async () => {
    const fetchImpl = makeFetch([
      (url) =>
        url === "https://example.com/"
          ? htmlPage(
              '<link rel="icon" href="/big.png" sizes="512x512" type="image/png">' +
                '<link rel="icon" href="/icon.svg" type="image/svg+xml">',
            )
          : null,
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
    });
    expect(result.url).toBe("https://example.com/icon.svg");
    expect(result.isVector).toBe(true);
  });

  it("lets a manifest icon outrank smaller link icons", async () => {
    const manifest = JSON.stringify({
      icons: [{ src: "/icons/512.png", sizes: "512x512", type: "image/png" }],
    });
    const fetchImpl = makeFetch([
      (url) =>
        url === "https://example.com/"
          ? htmlPage(
              '<link rel="icon" href="/small.png" sizes="16x16" type="image/png">' +
                '<link rel="manifest" href="/manifest.json">',
            )
          : null,
      (url) =>
        url === "https://example.com/manifest.json"
          ? new Response(manifest, { status: 200 })
          : null,
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
    });
    expect(result.url).toBe("https://example.com/icons/512.png");
    expect(result.source).toBe("manifest");
  });

  it("falls back to /favicon.ico when the page has no icon links", async () => {
    const fetchImpl = makeFetch([
      (url) => (url === "https://example.com/" ? htmlPage("") : null),
      (url) =>
        url === "https://example.com/favicon.ico"
          ? new Response("ico-bytes", { status: 200 })
          : null,
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
    });
    expect(result.url).toBe("https://example.com/favicon.ico");
    expect(result.source).toBe("favicon.ico");
  });

  it("falls back to the Google S2 service when favicon.ico also fails", async () => {
    const fetchImpl = makeFetch([
      (url) => (url === "https://example.com/" ? htmlPage("") : null),
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
    });
    expect(result.source).toBe("google-fallback");
    expect(result.url).toBe(
      "https://www.google.com/s2/favicons?domain=example.com&sz=64",
    );
  });

  it("still resolves via the Google fallback when the page itself is unreachable", async () => {
    const fetchImpl = makeFetch([]);
    const result = await getFavicon("https://unreachable.example.com/", {
      fetch: fetchImpl,
    });
    expect(result.source).toBe("google-fallback");
  });

  it("downloads the image when fetchImage is true", async () => {
    const fetchImpl = makeFetch([
      (url) =>
        url === "https://example.com/"
          ? htmlPage(
              '<link rel="icon" href="/icon.png" sizes="32x32" type="image/png">',
            )
          : null,
      (url) =>
        url === "https://example.com/icon.png"
          ? new Response(new Uint8Array([1, 2, 3]), {
              status: 200,
              headers: { "content-type": "image/png" },
            })
          : null,
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
      fetchImage: true,
    });
    expect(result.image?.mimeType).toBe("image/png");
    expect(result.image?.data).toBeInstanceOf(Buffer);
    expect(result.image?.data.length).toBe(3);
  });

  it("leaves image undefined (without throwing) when the image download fails", async () => {
    const fetchImpl = makeFetch([
      (url) =>
        url === "https://example.com/"
          ? htmlPage(
              '<link rel="icon" href="/icon.png" sizes="32x32" type="image/png">',
            )
          : null,
    ]);

    const result = await getFavicon("https://example.com/", {
      fetch: fetchImpl,
      fetchImage: true,
    });
    expect(result.url).toBe("https://example.com/icon.png");
    expect(result.image).toBeUndefined();
  });
});
