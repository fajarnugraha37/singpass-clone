import { Context } from 'hono';

export const getDiscoveryDocument = (c: Context) => {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  return c.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/auth`,
    token_endpoint: `${baseUrl}/api/token`,
    userinfo_endpoint: `${baseUrl}/api/userinfo`,
    jwks_uri: `${baseUrl}/.well-known/keys`,
    pushed_authorization_request_endpoint: `${baseUrl}/api/par`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['private_key_jwt'],
    code_challenge_methods_supported: ['S256'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['ES256'],
    dpop_signing_alg_values_supported: ['ES256'],
    id_token_encryption_alg_values_supported: ['ECDH-ES+A256KW'],
    id_token_encryption_enc_values_supported: ['A256GCM'],
    userinfo_encryption_alg_values_supported: ['ECDH-ES+A256KW'],
    userinfo_encryption_enc_values_supported: ['A256GCM'],
  });
};
