# Research: Serving Static Assets with Hono

**Date**: 2026-03-14

## Decision

We will use the `serveStatic` middleware from `hono/bun` to serve the static assets from the frontend build.

## Rationale

- Hono provides a specific, optimized `serveStatic` middleware for different JavaScript runtimes. Given this project uses Bun, `hono/bun` is the correct choice.
- The `serveStatic` middleware is designed for this exact use case and supports features like root path definition, which is required by the specification.
- It also supports ETags out of the box, which aligns with the caching requirement in the specification.

## Alternatives Considered

- **`@hono/node-server/serve-static`**: This is the equivalent middleware for Node.js. Since the project is using Bun, the Bun-specific middleware is more appropriate.
- **Custom Middleware**: Writing a custom middleware would be unnecessary reinvention of the wheel, as Hono provides a well-tested and optimized solution.
- **`toSSG`**: This is a build-time tool for static site generation from Hono routes, which is not what is required here. The requirement is to serve pre-built static assets at runtime.
