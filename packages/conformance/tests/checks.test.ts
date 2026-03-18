import { describe, it, expect, mock, beforeEach } from "bun:test";
import { checkDiscovery } from "../src/checks/discovery.ts";
import { type AuditorConfig } from "../src/utils/types.ts";

const mockConfig: AuditorConfig = {
  targetDiscoveryUrl: "https://localhost/.well-known/openid-configuration",
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
      authorization_endpoint: "https://localhost/auth",
      token_endpoint: "https://localhost/token",
      userinfo_endpoint: "https://localhost/userinfo",
      jwks_uri: "https://localhost/jwks",
      pushed_authorization_request_endpoint: "https://localhost/par",
      issuer: "https://localhost",
    };

    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(mockDoc))));

    const result = await checkDiscovery(mockConfig);
    expect(result.status).toBe("PASS");
  });

  it("should fail discovery check if required endpoints are missing", async () => {
    const mockDoc = {
      authorization_endpoint: "https://localhost/auth",
    };

    global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(mockDoc))));

    const result = await checkDiscovery(mockConfig);
    expect(result.status).toBe("FAIL");
    expect(result.finding).toContain("Missing required endpoints");
  });
});
