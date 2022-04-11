# `deno-gemini`

## Client

The client was inspired a lot by modern `fetch` API. It is really nice to use:

```ts
import { gfetch } from "https://deno.land/x/gemfetch/mod.ts";

// Will automatically follow redirects, and throw errors on non-2X or 3X codes.
const response = await gfetch("gemini://gemini.circumlunar.space");
const text = await response.text();

console.log(text); // prints "Project Gemini" homepage
```

Make sure to run with `--unsafely-ignore-certificate-errors` flag!

<details>
<summary>Why is --unsafely-ignore-certificate-errors needed?</summary>
<br>
Deno currently throws an error if the certificate is not trusted by a root
authority. There is currently no way to override this with code, so the flag is
needed to allow Deno to connect to servers with self-signed certificates.

You can omit the flag if you either:

- are only connecting to servers with CA signed certificates
- or know your server's certificate upfront (pass in options via cert)
</details>

## Server

Not yet complete. Soon(tm)
