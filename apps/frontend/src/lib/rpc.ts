import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';

// The backend URL uses the unified HTTPS origin, but uses relative paths in the browser
// to rely on the Vite proxy and avoid CORS/SameSite cookie issues in development.
const isBrowser = typeof window !== 'undefined';
const backendUrl = isBrowser ? '' : (import.meta.env.PUBLIC_BACKEND_URL || 'https://localhost');

export const client = hc<AppType>(backendUrl, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'include',
    });
  }
});