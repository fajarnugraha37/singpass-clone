import { describe, it, expect, mock } from "bun:test";
import { secureFetch } from "../src/utils/http.ts";

describe("HTTP Utils", () => {
  it("should perform a secure fetch", async () => {
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ ok: true }))));

    const response = await secureFetch("http://localhost");
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
