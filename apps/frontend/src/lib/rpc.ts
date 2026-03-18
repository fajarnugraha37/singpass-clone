import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/index';

// The backend URL uses the unified HTTPS origin
const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://localhost';

export const client = hc<AppType>(backendUrl);