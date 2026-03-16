import { createMiddleware } from 'hono/factory';

/**
 * FAPI 2.0 / Singpass Security Headers Middleware
 * Enforces strict caching and framing policies for OIDC endpoints.
 */
export const fapiHeaders = createMiddleware(async (c, next) => {
  await next();
  
  // Mandatory FAPI 2.0 caching headers
  c.header('Cache-Control', 'no-store');
  c.header('Pragma', 'no-cache');
  
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  // Singpass requires strict frame-ancestors and limited script sources
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; script-src 'none'; style-src 'none'; img-src 'none'; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; base-uri 'none'; form-action 'none';");
});
