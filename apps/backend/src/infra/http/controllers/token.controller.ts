import { Context } from 'hono';
import { z } from 'zod';
import { TokenExchangeUseCase } from '../../../core/use-cases/token-exchange';
import { FapiErrors } from '../../middleware/fapi-error';

/**
 * Request body schema for the token exchange endpoint.
 * RFC 6749 and RFC 7523 (private_key_jwt).
 */
export const tokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  redirect_uri: z.string(),
  code_verifier: z.string(),
  client_assertion_type: z.literal('urn:ietf:params:oauth:client-assertion-type:jwt-bearer'),
  client_assertion: z.string(),
});

/**
 * Controller for the POST /token endpoint.
 */
export const exchangeToken = (useCase: TokenExchangeUseCase) => async (c: Context) => {
  // 1. Mandatory DPoP header check
  const dpopHeader = c.req.header('DPoP');
  if (!dpopHeader) {
    throw FapiErrors.invalidDpopProof('Missing mandatory DPoP header');
  }

  // 2. Parse request body
  const body = await c.req.parseBody();
  const validation = tokenRequestSchema.safeParse(body);

  if (!validation.success) {
    throw FapiErrors.invalidRequest('Missing or malformed parameters');
  }

  const {
    grant_type,
    code,
    redirect_uri,
    code_verifier,
    client_assertion_type,
    client_assertion,
  } = validation.data;

  // 3. Execute use case
  const result = await useCase.execute({
    grantType: grant_type,
    code,
    redirectUri: redirect_uri,
    codeVerifier: code_verifier,
    clientAssertionType: client_assertion_type,
    clientAssertion: client_assertion,
    dpopHeader,
    method: c.req.method,
    url: c.req.url,
  });

  return c.json(result);
};
