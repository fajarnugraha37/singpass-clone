import { expect, test, describe } from 'bun:test'
import app from '../../../src/index'

describe('OIDC Discovery Endpoint', () => {
  test('GET /.well-known/openid-configuration should return 200 OK and valid JSON', async () => {
    const res = await app.request('/.well-known/openid-configuration')
    expect(res.status).toBe(200)
    const body = await res.json()
    
    expect(body).toHaveProperty('issuer')
    expect(body).toHaveProperty('authorization_endpoint')
    expect(body).toHaveProperty('token_endpoint')
    expect(body).toHaveProperty('jwks_uri')
    expect(body).toHaveProperty('pushed_authorization_request_endpoint')
    expect(body.response_types_supported).toContain('code')
    expect(body.grant_types_supported).toContain('authorization_code')
    expect(body.token_endpoint_auth_methods_supported).toContain('private_key_jwt')
  })
})
