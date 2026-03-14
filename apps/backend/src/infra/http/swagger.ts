import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

export const setupSwagger = (app: OpenAPIHono) => {
  console.info('[Swagger] Initializing OpenAPI documentation at /doc and UI at /ui');
  // The OpenAPI documentation will be available at /doc
  return app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Vibe Auth API',
      description: 'FAPI 2.0 Compliant OIDC Provider',
    },
  })
  // Swagger UI will be available at /ui
  .get('/ui', swaggerUI({ url: '/doc' }));
};
