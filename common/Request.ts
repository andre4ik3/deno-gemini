import { CRLF } from "./Utils.ts";

/**
 * Represents the data that a request can be initialized with.
 */
export type GRequestInit = Uint8Array | string | URL;

/**
 * Represents a Gemini client or server request.
 */
export class GRequest {
  rawData: Uint8Array;
  url: URL;

  constructor(init: GRequestInit) {
    if (init instanceof URL || typeof init === "string") {
      // Create a URL header from a URL or string.
      this.url = init instanceof URL ? init : new URL(init);
      this.rawData = new TextEncoder().encode(this.url + CRLF);
    } else {
      // Parse the raw data into a URL.
      this.rawData = init;
      const rawUrl = new TextDecoder().decode(this.rawData);

      // Find the first occurance of CRLF and ignore everything after it.
      this.url = new URL(rawUrl.split(CRLF)[0]);
    }
  }
}
