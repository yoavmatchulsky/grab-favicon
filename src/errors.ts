export class InvalidFaviconUrlError extends Error {
  constructor(url: string) {
    super(`Invalid favicon URL: ${url}`);
    this.name = "InvalidFaviconUrlError";
  }
}
