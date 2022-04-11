import { GRequest, GResponse } from "../common/mod.ts";

export interface GFetchOpt {
  /**
   * If true (default), will follow all 3X status codes. The response that is
   * returned will be the one from the last request that was made that didn't
   * return a 3X redirect.
   */
  followRedirects?: boolean;

  /**
   * If specified, will connect to the hostname, overriding the URL's hostname.
   * This can be used for proxying requests.
   */
  hostname?: string;

  /**
   * If specified, will connect to this port, overriding the URL's port (or the
   * default 1965). This can be used for proxying requests.
   */
  port?: number;

  /**
   * If true, requests made will not throw errors based on status codes (by
   * default, all non-2X or 3X status codes will throw an error)
   */
  safe?: boolean;

  /**
   * If specified, will override the query/input in the URL with the input here
   * (i.e. the ?data string, where data is the input)
   */
  input?: string;

  /**
   * The certificate to validate the server's cert against. If it's a mismatch,
   * the request will fail.
   */
  caCerts?: string | string[];
}

export type GFetchInit = string | URL | GRequest;

/**
 * Fetches a Gemini resource from a URL.
 * @param u The URL to fetch (or request object).
 * @param o The options to use.
 * @returns A promise that resolves to the response.
 */
export async function gfetch(u: GFetchInit, o?: GFetchOpt): Promise<GResponse> {
  const url = typeof u === "string" ? new URL(u) : u instanceof URL ? u : u.url;

  const hostname = o?.hostname || url.hostname;
  const port = o?.port || parseInt(url.port) || 1965;

  // Default options
  const followRedirects = o?.followRedirects || true;
  const safe = o?.safe || false;
  const caCerts = Array.isArray(o?.caCerts)
    ? o!.caCerts
    : o?.caCerts
    ? [o!.caCerts]
    : [];

  if (o?.input) url.search = o.input;

  // Create request object
  const req = u instanceof GRequest ? u : new GRequest(url);
  const conn = await Deno.connectTls({ hostname, port, caCerts });

  // Send the request
  await conn.write(req.rawData);
  const resp = await new GResponse(conn).recv();

  // Follow redirects if necessary
  if (followRedirects && resp.redirect && resp.meta) {
    return gfetch(resp.meta, o);
  } else if (!resp.ok && !safe) {
    throw new Error(`Request not OK - ${resp.status} ${resp.meta}`);
  }

  return resp;
}

/** Alias for gfetch. */
export const gemfetch = gfetch;
