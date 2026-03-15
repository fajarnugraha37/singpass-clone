import { describe, it, expect } from "bun:test";
import { generatePkce, decodeJwt } from "../src/utils/crypto.ts";
import * as jose from "jose";

describe("Crypto Utils", () => {
  it("should generate valid PKCE challenge and verifier", async () => {
    const { verifier, challenge } = await generatePkce();
    expect(verifier).toBeDefined();
    expect(challenge).toBeDefined();
  });

  it("should decode JWT payload correctly", async () => {
    const payload = { sub: "123", name: "John" };
    const secret = new TextEncoder().encode("a-very-long-secret-key-that-is-at-least-32-chars-long");
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);
    
    const decoded = decodeJwt(token);
    expect(decoded.sub).toBe("123");
    expect(decoded.name).toBe("John");
  });
});
