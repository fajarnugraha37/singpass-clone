import { describe, it, expect, mock, beforeEach } from "bun:test";
import { checkDiscovery } from "../src/checks/discovery.ts";
import { type AuditorConfig } from "../src/utils/types.ts";

const mockConfig: AuditorConfig = {
  targetDiscoveryUrl: "http://localhost:3000/.well-known/openid-configuration",
  clientId: "TEST_CLIENT",
  clientAssertionType: "client_secret",
  redirectUri: "http://localhost:8080/callback",
  requestedScopes: ["openid"],
  useDpop: false,
};

describe("Checks", () => {
  beforeEach(() => {
    // Reset global fetch mock
    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({ ok: true }))));
  });

  it("should pass discovery check if all endpoints are present", async () => {
    const mockDoc = {
      authorization_endpoint: "http://localhost:3000/auth",
      token_endpoint: "http://localhost:3000/token",
      userinfo_endpoint: "http://localhost:3000/userinfo",
      jwks_uri: "http://localhost:3000/jwks",
      pushed_authorization_request_endpoint: "http://localhost:3000/par",
      issuer: "http://localhost:3000",
    };

    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(mockDoc))));

    const result = await checkDiscovery(mockConfig);
    expect(result.status).toBe("PASS");
  });

  it("should fail discovery check if required endpoints are missing", async () => {
    const mockDoc = {
      authorization_endpoint: "http://localhost:3000/auth",
    };

    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(mockDoc))));

    const result = await checkDiscovery(mockConfig);
    expect(result.status).toBe("FAIL");
    expect(result.finding).toContain("Missing required endpoints");
  });
});
