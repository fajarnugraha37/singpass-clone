# Quickstart: Serving Static Assets

This feature introduces a middleware to serve static assets from the `apps/backend` service.

## Configuration

1.  **Enable the middleware**: In the main application file for the backend (`apps/backend/src/index.ts` or similar), add the `serveStatic` middleware.

    ```typescript
    import { Hono } from 'hono'
    import { serveStatic } from 'hono/bun'

    const app = new Hono()

    // Serve static files from the 'dist' directory of the frontend app
    app.use('/*', serveStatic({ root: '../frontend/dist' }))

    // Your other API routes...

    export default app
    ```

2.  **Frontend Build**: Ensure your frontend application is configured to build into the `apps/frontend/dist` directory.

## Running the Application

1.  Build the frontend application.
2.  Start the backend server.
3.  Navigate to the root URL of the backend server in your browser. The frontend application should load.
