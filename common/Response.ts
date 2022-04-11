import { CRLF, GeminiStatus, GBodyInit } from "./utils.ts";

/**
 * Represents a Gemini response that is either sent by a server or received by
 * a client.
 */
export class GResponse {
  /** Represents the socket that is used to send/receive the response. */
  readonly socket: Deno.TlsConn;

  /** The status code of the response. */
  status: GeminiStatus = 20;

  /** The meta text of the response. */
  meta?: string;

  /**
   * Creates a new response.
   * @param socket The socket to attach to the response.
   */
  constructor(socket: Deno.TlsConn) {
    this.socket = socket;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Utilities                                                                //
  //////////////////////////////////////////////////////////////////////////////

  /** True if the response code is a 2X status. */
  get ok() {
    return this.status >= 20 && this.status < 30;
  }

  /** True if the response code is a 3X status. */
  get redirect() {
    return this.status >= 30 && this.status < 40;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Creating body/request                                                    //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Sets the status line of the response.
   * @param status The status code of the response.
   * @param meta The meta text of the response.
   * @returns The response.
   */
  setStatus(status: GeminiStatus, meta?: string) {
    this.status = status;
    this.meta = meta || (this.ok ? "text/gemini" : undefined);
    return this;
  }

  /**
   * Sends the response to the client, then closes the socket.
   * @param data The data to send.
   */
  async send(data?: GBodyInit) {
    for await (const chunk of this.build(data)) await this.socket.write(chunk);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Consuming body                                                           //
  //////////////////////////////////////////////////////////////////////////////

  /** Returns the readable body */
  get body() {
    return this.socket.readable;
  }

  /** True if the body has already been used. */
  get bodyUsed() {
    return this.socket.readable.locked;
  }

  /**
   * Converts the response to a string.
   * @returns The response data as a string.
   */
  async text() {
    const decoder = new TextDecoder();
    let text = "";
    // Iterate over the body uint8arrays and convert them to strings as chunks
    for await (const chunk of this.body.tee()[0]) text += decoder.decode(chunk);
    return text;
  }

  /**
   * Converts the response to JSON.
   * @returns The response data as JSON.
   */
  async json() {
    const rawBody = await this.text();
    return JSON.parse(rawBody);
  }

  /**
   * Converts the response to a blob.
   * @returns The response data as a blob.
   */
  async blob() {
    const rawBody: Uint8Array[] = [];
    for await (const chunk of this.body.tee()[0]) rawBody.push(chunk);
    return new Blob(rawBody);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Sending / Receiving                                                      //
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Builds the response as a Uint8Array.
   * @param data The data to encode.
   * @returns The raw data.
   */
  private async *build(data?: GBodyInit) {
    const statusLine = `${this.status} ${this.meta}${CRLF}`;

    let blob: Blob;

    // Handle all possible types of data
    if (data instanceof Blob) blob = data;
    else if (data instanceof Uint8Array) blob = new Blob([data]);
    else blob = new Blob([new TextEncoder().encode(data)]);

    // Build the response
    const reqData = new Blob([statusLine, blob]);
    for await (const chunk of reqData.stream()) yield chunk;
  }

  /** Reads the socket's first line, then sets attributes based on that. */
  async recv() {
    const decoder = new TextDecoder();
    const [CR, LF] = new TextEncoder().encode(CRLF);

    let rawStatusLine = "";
    let sawCR = false;

    while (true) {
      const buf = new Uint8Array(1);
      const bytesRead = await this.socket.read(buf);

      // If the socket is closed, return
      if (bytesRead === 0 || bytesRead === null) break;
      else if (buf[0] === LF && sawCR) break;
      else if (buf[0] === CR) sawCR = true;
      else rawStatusLine += decoder.decode(buf);
    }

    // Parse the status line
    const statusLineParts = rawStatusLine.split(" ");
    this.status = parseInt(statusLineParts.shift()!);
    this.meta = statusLineParts.join(" ");

    return this;
  }
}
