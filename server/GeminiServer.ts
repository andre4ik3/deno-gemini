import Mitt from "https://esm.sh/mitt@3.0.0";

type ListenCallback = (port: number) => unknown;

export interface GeminiServerOptions {
  /**
   * This should be a string with the server's public key (or certificate).
   * @example cert: await Deno.readTextFile("./cert.pem")
   */
  cert: string;

  /**
   * This should be a string with the server's private key.
   * @example key: await Deno.readTextFile("./cert.key")
   */
  key: string;
}

/**
 * Represents a Gemini server.
 */
export class GeminiServer {
  private emitter = Mitt();
  /**
   * Represents the raw TLS listener of the server.
   */
  private listener?: Deno.TlsListener;

  /**
   * Object with public and private key of the server. It is runtime-private to
   * help fix security issues (e.g. )
   */
  #tls: { cert: string; key: string };

  constructor(options: GeminiServerOptions) {
    // Overwrite default options
    this.#tls = { ...options };
  }

  /**
   * Creates a TLS listener that the server listens on, then runs the callback.
   * @param host The hostname to listen to. Defaults to "0.0.0.0".
   * @param port The port to listen to. Defaults to "1965".
   * @param callback The callback function to run once listening (with port num)
   */
  listen(host?: string, port?: number, callback?: ListenCallback): void;
  listen(port?: number, callback?: ListenCallback): void;
  listen(h?: string | number, p?: number | ListenCallback, c?: ListenCallback) {
    // Define variables based on what the function is called with
    const hostname = typeof h === "string" ? h : "0.0.0.0";
    const port = typeof h === "number" ? h : typeof p === "number" ? p : 1965;
    const callback = typeof p === "function" ? p : c;

    this.listener = Deno.listenTls({ hostname, port, ...this.#tls });
    if (callback) callback(port);
    this.listener.accept().then((v) => {});
  }
}
