import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { getDiscoveryDocument } from '../../../src/infra/http/controllers/discovery.controller';

describe('Discovery Controller', () => {
  it('should return 200 and valid discovery JSON', async () => {
    const app = new Hono();
    app.get('/.well-known/openid-configuration', getDiscoveryDocument);

    const res = await app.request('/.well-known/openid-configuration');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.issuer).toBeDefined();
    expect(data.authorization_endpoint).toContain('/api/auth');
    expect(data.token_endpoint).toContain('/api/token');
    expect(data.userinfo_endpoint).toContain('/api/userinfo');
    expect(data.jwks_uri).toContain('/.well-known/keys');
    expect(data.pushed_authorization_request_endpoint).toContain('/api/par');
    expect(data.response_types_supported).toContain('code');
    expect(data.grant_types_supported).toContain('authorization_code');
    expect(data.token_endpoint_auth_methods_supported).toContain('private_key_jwt');
    expect(data.code_challenge_methods_supported).toContain('S256');
  });
});
