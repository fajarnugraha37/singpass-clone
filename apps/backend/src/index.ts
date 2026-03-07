import { Hono } from 'hono'

const app = new Hono().basePath('/api')

const routes = app
  .get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export type AppType = typeof routes
export default app
