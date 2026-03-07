import { expect, test, describe } from 'bun:test'
import app from '../src/index'

describe('Backend Health Check', () => {
  test('GET /api/health should return 200 OK', async () => {
    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('status', 'ok')
  })
})
