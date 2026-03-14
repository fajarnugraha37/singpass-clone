/**
 * OpenAPI 3.0 specification for the Vibe Auth FAPI 2.0 OIDC Provider.
 * This is served at GET /doc and rendered by Swagger UI at GET /ui.
 */
export const openapiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Vibe Auth — FAPI 2.0 OIDC Provider',
    version: '1.0.0',
    description:
      'Singpass-compatible OIDC Authorization Server implementing FAPI 2.0 security profile.\n\n' +
      '**Flows**: Pushed Authorization Request (PAR) → Authorization → Token Exchange → UserInfo\n\n' +
      '**Security**: DPoP, PKCE (S256), private_key_jwt, JWS-in-JWE tokens',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local Development' },
  ],
  tags: [
    { name: 'OIDC Discovery', description: 'OpenID Connect Discovery and JWKS endpoints' },
    { name: 'PAR', description: 'Pushed Authorization Request (RFC 9126)' },
    { name: 'Authorization', description: 'Authorization endpoint and login flow' },
    { name: 'Token', description: 'Token exchange endpoint' },
    { name: 'UserInfo', description: 'UserInfo endpoint (Myinfo / Login)' },
    { name: 'Auth Flow', description: 'Interactive login & 2FA endpoints' },
    { name: 'System', description: 'Health checks and utilities' },
  ],
  paths: {
    // ─── OIDC Discovery ─────────────────────────────────────────
    '/.well-known/openid-configuration': {
      get: {
        tags: ['OIDC Discovery'],
        summary: 'OpenID Connect Discovery',
        description: 'Returns the OpenID Provider Configuration Information document.',
        operationId: 'getDiscoveryDocument',
        responses: {
          '200': {
            description: 'OpenID Provider Metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    issuer: { type: 'string', example: 'http://localhost:3000' },
                    authorization_endpoint: { type: 'string' },
                    token_endpoint: { type: 'string' },
                    userinfo_endpoint: { type: 'string' },
                    jwks_uri: { type: 'string' },
                    pushed_authorization_request_endpoint: { type: 'string' },
                    response_types_supported: { type: 'array', items: { type: 'string' }, example: ['code'] },
                    grant_types_supported: { type: 'array', items: { type: 'string' }, example: ['authorization_code'] },
                    token_endpoint_auth_methods_supported: { type: 'array', items: { type: 'string' }, example: ['private_key_jwt'] },
                    code_challenge_methods_supported: { type: 'array', items: { type: 'string' }, example: ['S256'] },
                    dpop_signing_alg_values_supported: { type: 'array', items: { type: 'string' }, example: ['ES256'] },
                    id_token_signing_alg_values_supported: { type: 'array', items: { type: 'string' }, example: ['ES256'] },
                    subject_types_supported: { type: 'array', items: { type: 'string' }, example: ['public'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/.well-known/keys': {
      get: {
        tags: ['OIDC Discovery'],
        summary: 'JSON Web Key Set (JWKS)',
        description: 'Returns the server\'s public signing keys in JWK format.',
        operationId: 'getJWKS',
        responses: {
          '200': {
            description: 'JWKS containing public keys',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    keys: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          kty: { type: 'string', example: 'EC' },
                          crv: { type: 'string', example: 'P-256' },
                          x: { type: 'string' },
                          y: { type: 'string' },
                          kid: { type: 'string' },
                          use: { type: 'string', example: 'sig' },
                          alg: { type: 'string', example: 'ES256' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ─── PAR ─────────────────────────────────────────────────────
    '/api/par': {
      post: {
        tags: ['PAR'],
        summary: 'Pushed Authorization Request',
        description:
          'Initiates an authorization request by pushing parameters to the server. ' +
          'Returns a `request_uri` to use at the authorization endpoint.\n\n' +
          'Requires `DPoP` header or `dpop_jkt` parameter. Client authentication via `private_key_jwt`.',
        operationId: 'registerPar',
        parameters: [
          {
            name: 'DPoP',
            in: 'header',
            required: false,
            description: 'DPoP proof JWT (recommended over dpop_jkt parameter)',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: [
                  'response_type', 'client_id', 'redirect_uri', 'scope',
                  'code_challenge', 'code_challenge_method', 'state', 'nonce',
                  'client_assertion_type', 'client_assertion',
                ],
                properties: {
                  response_type: { type: 'string', enum: ['code'], description: 'Must be "code"' },
                  client_id: { type: 'string', description: 'Registered client ID' },
                  redirect_uri: { type: 'string', format: 'uri', description: 'Pre-registered redirect URI' },
                  scope: { type: 'string', description: 'Space-delimited scopes (must include "openid")', example: 'openid uinfin name email' },
                  code_challenge: { type: 'string', description: 'Base64url-encoded SHA256 of code_verifier' },
                  code_challenge_method: { type: 'string', enum: ['S256'] },
                  state: { type: 'string', description: 'CSRF protection (UUID v4 recommended)' },
                  nonce: { type: 'string', description: 'Replay protection (UUID v4 recommended)' },
                  client_assertion_type: { type: 'string', enum: ['urn:ietf:params:oauth:client-assertion-type:jwt-bearer'] },
                  client_assertion: { type: 'string', description: 'Signed JWT client assertion' },
                  dpop_jkt: { type: 'string', description: 'JWK Thumbprint (alternative to DPoP header)' },
                  acr_values: { type: 'string', description: 'Requested assurance level', example: 'urn:singpass:authentication:loa:2' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'PAR registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    request_uri: { type: 'string', example: 'urn:ietf:params:oauth:request_uri:abc123' },
                    expires_in: { type: 'number', example: 60 },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/OAuthError' },
          '401': { $ref: '#/components/responses/OAuthError' },
        },
      },
    },

    // ─── Token ───────────────────────────────────────────────────
    '/api/token': {
      post: {
        tags: ['Token'],
        summary: 'Token Exchange',
        description:
          'Exchange an authorization code for an ID Token and Access Token.\n\n' +
          'Requires `DPoP` header (mandatory). Client authentication via `private_key_jwt`.\n\n' +
          'The ID Token is returned as a nested JWS-in-JWE (signed by server, encrypted with client key).',
        operationId: 'exchangeToken',
        parameters: [
          {
            name: 'DPoP',
            in: 'header',
            required: true,
            description: 'DPoP proof JWT (mandatory for FAPI 2.0)',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: ['grant_type', 'code', 'redirect_uri', 'code_verifier', 'client_assertion_type', 'client_assertion'],
                properties: {
                  grant_type: { type: 'string', enum: ['authorization_code'] },
                  code: { type: 'string', description: 'Authorization code from redirect' },
                  redirect_uri: { type: 'string', format: 'uri', description: 'Must match PAR redirect_uri' },
                  code_verifier: { type: 'string', description: 'PKCE code verifier (43-128 chars)' },
                  client_assertion_type: { type: 'string', enum: ['urn:ietf:params:oauth:client-assertion-type:jwt-bearer'] },
                  client_assertion: { type: 'string', description: 'Signed JWT client assertion' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token exchange successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access_token: { type: 'string', description: 'Opaque access token' },
                    id_token: { type: 'string', description: 'JWE Compact (nested JWS-in-JWE)' },
                    token_type: { type: 'string', enum: ['DPoP'] },
                    expires_in: { type: 'number', example: 3600 },
                    refresh_token: { type: 'string', description: 'Optional refresh token' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/OAuthError' },
          '401': { $ref: '#/components/responses/OAuthError' },
        },
      },
    },

    // ─── UserInfo ────────────────────────────────────────────────
    '/api/userinfo': {
      get: {
        tags: ['UserInfo'],
        summary: 'Get UserInfo',
        description:
          'Retrieve user identity data based on the access token\'s authorized scopes.\n\n' +
          'Response is a JWE Compact string containing a signed (JWS) payload with `person_info`.\n\n' +
          'Requires both `Authorization: DPoP <token>` and `DPoP` proof headers.',
        operationId: 'getUserInfo',
        parameters: [
          {
            name: 'Authorization',
            in: 'header',
            required: true,
            description: 'DPoP-bound access token',
            schema: { type: 'string', example: 'DPoP eyJ0eXAiOi...' },
          },
          {
            name: 'DPoP',
            in: 'header',
            required: true,
            description: 'DPoP proof JWT with htm=GET, htu matching this endpoint',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Encrypted UserInfo response (JWE Compact)',
            content: {
              'application/jwt': {
                schema: { type: 'string', description: 'JWE Compact string containing signed person_info' },
              },
            },
          },
          '401': {
            description: 'Authentication error',
            headers: {
              'WWW-Authenticate': {
                schema: { type: 'string', example: 'DPoP error="invalid_token"' },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/OAuthError' },
              },
            },
          },
        },
      },
      post: {
        tags: ['UserInfo'],
        summary: 'Get UserInfo (POST)',
        description: 'Same as GET /api/userinfo but via POST. Provided for OIDC compatibility.',
        operationId: 'getUserInfoPost',
        parameters: [
          { name: 'Authorization', in: 'header', required: true, schema: { type: 'string' } },
          { name: 'DPoP', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Encrypted UserInfo response',
            content: { 'application/jwt': { schema: { type: 'string' } } },
          },
          '401': { $ref: '#/components/responses/AuthError' },
        },
      },
    },

    // ─── Auth Flow ───────────────────────────────────────────────
    '/api/auth': {
      get: {
        tags: ['Authorization'],
        summary: 'Authorization Endpoint',
        description:
          'Initiates the authorization flow. Accepts `client_id` and `request_uri` from PAR.\n\n' +
          'Creates an auth session and redirects to the login page.',
        operationId: 'initiateAuth',
        parameters: [
          { name: 'client_id', in: 'query', required: true, schema: { type: 'string' }, description: 'Client ID' },
          { name: 'request_uri', in: 'query', required: true, schema: { type: 'string' }, description: 'PAR request_uri' },
        ],
        responses: {
          '302': { description: 'Redirect to login page with session cookie' },
          '400': { description: 'Invalid or expired request_uri' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth Flow'],
        summary: 'Validate Login Credentials',
        description: 'Validates username (NRIC) and password. Requires active auth session cookie.',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', description: 'NRIC (e.g., S1234567A)', example: 'S1234567A' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login result',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', enum: [true] },
                        next_step: { type: 'string', enum: ['2fa'] },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', enum: [false] },
                        error: { type: 'string' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/2fa': {
      post: {
        tags: ['Auth Flow'],
        summary: 'Validate 2FA OTP',
        description:
          'Validates the 6-digit OTP. On success, generates an authorization code and returns a redirect URI.',
        operationId: 'validate2fa',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['otp'],
                properties: {
                  otp: { type: 'string', minLength: 6, maxLength: 6, example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '2FA result',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', enum: [true] },
                        redirect_uri: { type: 'string', format: 'uri' },
                      },
                    },
                    {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean', enum: [false] },
                        error: { type: 'string' },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // ─── System ──────────────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ─── Shared Components ───────────────────────────────────────
  components: {
    schemas: {
      OAuthError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            enum: [
              'invalid_request', 'invalid_client', 'invalid_grant',
              'unauthorized_client', 'unsupported_grant_type',
              'invalid_scope', 'invalid_dpop_proof', 'invalid_token',
              'server_error', 'temporarily_unavailable',
            ],
          },
          error_description: { type: 'string' },
          error_uri: { type: 'string', format: 'uri' },
        },
        required: ['error'],
      },
    },
    responses: {
      OAuthError: {
        description: 'OAuth 2.0 Error Response',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OAuthError' },
          },
        },
      },
      AuthError: {
        description: 'Authentication Error (with WWW-Authenticate header)',
        headers: {
          'WWW-Authenticate': {
            schema: { type: 'string', example: 'DPoP error="invalid_token"' },
          },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OAuthError' },
          },
        },
      },
    },
    securitySchemes: {
      DPoPAuth: {
        type: 'http',
        scheme: 'DPoP',
        description: 'DPoP-bound access token in Authorization header + DPoP proof in separate header',
      },
    },
  },
} as const;
