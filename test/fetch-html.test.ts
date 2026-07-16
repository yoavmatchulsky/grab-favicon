import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOk, fetchPageHtml } from "../src/fetch-html";

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

  it("stops reading once </head> appears, without consuming the rest of the body", async () => {
    const chunks = [
      "<html><head><title>x</title>",
      "</head><body>SHOULD_NOT_APPEAR",
      "<div>more body content that should never be read</div></body></html>",
    ];
    let pullCount = 0;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      pull(controller) {
        pullCount++;
        if (pullCount > chunks.length) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(chunks[pullCount - 1]));
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(stream, { status: 200 })),
    );

    const result = await fetchPageHtml("https://example.com/");
    expect(result?.html).toContain("</head>");
    expect(result?.html).not.toContain("more body content");
    // The stream's default queuing strategy prefetches one chunk ahead of
    // what's actually been read, so `pull` may fire once more than the
    // chunks we decode. What matters is the last chunk's content was never
    // read into `html` (asserted above) and the stream never fully drained
    // to completion (which would take one extra `pull` beyond `chunks.length`).
    expect(pullCount).toBeLessThanOrEqual(chunks.length);
  });

  it("stops reading once <body> appears even without a closing </head> tag", async () => {
    const chunks = [
      "<html><head><title>x</title>",
      "<body>content",
      "more body content that should never be read",
    ];
    let pullCount = 0;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      pull(controller) {
        pullCount++;
        if (pullCount > chunks.length) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(chunks[pullCount - 1]));
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(stream, { status: 200 })),
    );

    const result = await fetchPageHtml("https://example.com/");
    expect(result?.html).toContain("<body>");
    expect(result?.html).not.toContain("more body content");
    // The stream's default queuing strategy prefetches one chunk ahead of
    // what's actually been read, so `pull` may fire once more than the
    // chunks we decode. What matters is the last chunk's content was never
    // read into `html` (asserted above) and the stream never fully drained
    // to completion (which would take one extra `pull` beyond `chunks.length`).
    expect(pullCount).toBeLessThanOrEqual(chunks.length);
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
