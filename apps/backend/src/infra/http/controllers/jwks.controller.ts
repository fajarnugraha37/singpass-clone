import { Context } from 'hono';
import type { CryptoService } from '../../../core/domain/crypto_service';

export const getJWKS = (cryptoService: CryptoService) => {
  return async (c: Context) => {
    const jwks = await cryptoService.getPublicJWKS();
    return c.json(jwks);
  };
};
