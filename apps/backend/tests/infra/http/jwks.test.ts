import { expect, test, describe } from 'bun:test'
import app from '../../../src/index'

describe('JWKS Endpoint', () => {
  test('GET /.well-known/keys should return 200 OK and valid JWKS', async () => {
    const res = await app.request('/.well-known/keys')
    expect(res.status).toBe(200)
    const body = await res.json()
    
    expect(body).toHaveProperty('keys')
    expect(Array.isArray(body.keys)).toBe(true)
    if (body.keys.length > 0) {
      const key = body.keys[0]
      expect(key).toHaveProperty('kid')
      expect(key).toHaveProperty('kty', 'EC')
      expect(key).toHaveProperty('crv', 'P-256')
      expect(key).toHaveProperty('x')
      expect(key).toHaveProperty('y')
    }
  })
})
