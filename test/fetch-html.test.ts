import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOk, fetchPageHtml } from "../src/fetch-html.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPageHtml", () => {
  it("returns html and the final (post-redirect) url on success", async () => {
    const fetchMock = vi.fn(async () => {
      const response = new Response("<html><head></head></html>", {
        status: 200,
      });
      Object.defineProperty(response, "url", {
        value: "https://final.example.com/",
      });
      return response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchPageHtml("https://example.com/");
    expect(result?.html).toContain("<head>");
    expect(result?.finalUrl).toBe("https://final.example.com/");
  });

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    await expect(fetchPageHtml("https://example.com/")).resolves.toBeNull();
  });

  it("returns null when fetch throws (network error / timeout)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(fetchPageHtml("https://example.com/")).resolves.toBeNull();
  });
});

describe("fetchOk", () => {
  it("returns the response on a 2xx status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("ok", { status: 200 })),
    );
    const response = await fetchOk("https://example.com/favicon.ico");
    expect(response?.status).toBe(200);
  });

  it("returns null on a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );
    await expect(
      fetchOk("https://example.com/favicon.ico"),
    ).resolves.toBeNull();
  });
});
