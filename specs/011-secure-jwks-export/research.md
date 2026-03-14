# Research: Secure Public JWK Export

## Decision

The selected approach is to export the full JWK from the private `CryptoKey` object and then programmatically remove all known private key components before returning it to the client. This is the most portable and explicit method.

## Rationale

The `jose` library's `exportJWK` function, when used with an extractable private key, includes private components (like `d`) in the output. The underlying Web Crypto API does not provide a direct method to derive a public `CryptoKey` from a private one in a platform-agnostic way.

While a Node.js-specific solution using `node:crypto.createPublicKey` exists, it would tie the application to the Node.js runtime. The chosen method of manually stripping private fields is explicitly recommended in `jose` documentation for cross-platform compatibility (Node.js, Deno, Cloudflare Workers, browsers).

This approach is clear, auditable, and guarantees that only public fields are ever exposed.

### Stripping Logic

Based on the key type (`kty`), the following private components will be deleted from the exported JWK object:

| Key Type (`kty`) | Private Fields to Remove |
| :--- | :--- |
| **EC** | `d` |
| **OKP** | `d` |
| **RSA** | `d`, `p`, `q`, `dp`, `dq`, `qi`|

The project currently uses EC keys, so only the `d` parameter needs to be removed. The implementation should, however, be robust enough to handle other key types if they are introduced in the future.

## Alternatives Considered

1.  **Node.js `createPublicKey`**: This involves using the native `node:crypto` module to create a public key object from the private key, which can then be safely exported.
    -   **Rejected because**: It introduces a Node.js-specific dependency, which conflicts with the goal of being runtime-agnostic (as supported by Bun and Hono).
2.  **Using a different library**: Switching to another crypto library.
    -   **Rejected because**: The `jose` library is an established dependency in the project. Introducing a new library for this single purpose would add unnecessary complexity.
