import { describe, it, expect, mock, spyOn } from "bun:test";
import { secureFetch, generateDpopHeader } from "../src/utils/http.ts";
import * as jose from "jose";

describe("HTTP Utils", () => {
  it("should perform a secure fetch", async () => {
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ ok: true }));
    });

    const response = await secureFetch("http://localhost");
    const data = await response.json();
    expect(data.ok).toBe(true);
    fetchMock.mockRestore();
  });

  it("should handle JSON body in secureFetch", async () => {
    const fetchMock = spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      expect(options?.headers).toHaveProperty('Content-Type', 'application/json');
      expect(options?.body).toBe(JSON.stringify({ foo: 'bar' }));
      return new Response(JSON.stringify({ ok: true }));
    });

    await secureFetch("http://localhost", {
      method: 'POST',
      body: { foo: 'bar' }
    });
    
    fetchMock.mockRestore();
  });

  it("should generate a valid DPoP proof", async () => {
    const { privateKey } = await jose.generateKeyPair('ES256', { extractable: true });
    const method = 'POST';
    const url = 'https://api.vibe.com/token';
    const nonce = 'nonce-abc';

    const proof = await generateDpopHeader(method, url, privateKey, nonce);
    expect(proof).toBeDefined();
    expect(typeof proof).toBe('string');

    const decoded = jose.decodeJwt(proof);
    expect(decoded.htm).toBe(method);
    expect(decoded.htu).toBe(url);
    expect(decoded.nonce).toBe(nonce);
    expect(decoded.jti).toBeDefined();

    const header = jose.decodeProtectedHeader(proof);
    expect(header.alg).toBe('ES256');
    expect(header.typ).toBe('dpop+jwt');
    expect(header.jwk).toBeDefined();
  });
});
