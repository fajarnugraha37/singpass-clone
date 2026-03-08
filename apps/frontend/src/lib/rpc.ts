import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';

// The backend URL is typically http://localhost:3000 in development
const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3000';

export const client = hc<AppType>(backendUrl);