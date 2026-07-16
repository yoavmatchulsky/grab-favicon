# grab-favicon

Find the best favicon for a website URL.

Given a page URL, `grab-favicon` fetches the page, inspects `<link rel="icon">` /
`apple-touch-icon` tags and the web app manifest, and picks the best candidate —
preferring vector (SVG) icons, then the largest declared raster size. If nothing
is found on the page it falls back to `/favicon.ico`, and finally to Google's
favicon service as a guaranteed last resort.

## Install

```sh
npm install grab-favicon
```

## Usage

```ts
import { getFavicon } from "grab-favicon";

const result = await getFavicon("https://example.com");

console.log(result.url);      // resolved favicon URL
console.log(result.source);   // "link-icon" | "apple-touch-icon" | "manifest" | "favicon.ico" | "google-fallback"
console.log(result.isVector); // true if it's an SVG
console.log(result.sizes);    // { width, height } if known
console.log(result.candidates); // every candidate found, best-first
```

### Downloading the image

Pass `grabImage: true` to also download the winning icon's bytes:

```ts
const result = await getFavicon("https://example.com", { fetchImage: true });

if (result.image) {
  console.log(result.image.mimeType); // e.g. "image/png"
  console.log(result.image.data);     // Buffer
}
```

Image download failures never throw — `result.image` is simply left `undefined`
while the rest of the result (the resolved URL and metadata) is still returned.

### Options

```ts
interface GetFaviconOptions {
  grabImage?: boolean;         // default false
  timeoutMs?: number;          // per-request timeout, default 8000
  userAgent?: string;          // default is a realistic desktop Chrome UA
  googleFallbackSize?: number; // size (px) requested from the Google fallback, default 64
  fetch?: typeof fetch;        // inject a custom fetch implementation (useful for testing)
}
```

### Error handling

`getFavicon()` throws `InvalidFaviconUrlError` only when the input isn't a
syntactically valid `http:`/`https:` URL. Every network failure (unreachable
page, broken manifest, missing favicon.ico) degrades gracefully through the
fallback chain instead of throwing, so the function is safe to call in bulk
over many URLs — worst case, `result.source` ends up `"google-fallback"`.

## Requirements

Node.js >= 20.

## License

MIT
