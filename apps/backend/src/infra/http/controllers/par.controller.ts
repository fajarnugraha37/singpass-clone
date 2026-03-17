import { Context } from 'hono';
import { RegisterParUseCase } from '../../../core/use-cases/register-par';
import { parRequestSchema } from '../../../../../../packages/shared/src/config';

export const registerPar = (useCase: RegisterParUseCase) => {
  return async (c: Context) => {
    try {
      const body = await c.req.parseBody();
      
      // Validate via Zod
      const validated = parRequestSchema.safeParse(body);
      if (!validated.success) {
        return c.json({
          error: 'invalid_request',
          error_description: validated.error.message
        }, 400);
      }

      // Check DPoP header
      const dpop = c.req.header('DPoP');
      
      // FAPI 2.0: If DPoP is used, we need to bind it.
      // RegisterParUseCase.execute takes the input and handles it.
      const result = await useCase.execute({
        ...validated.data,
        dpop_header: dpop,
      });

      if (result.dpop_nonce) {
        c.header('DPoP-Nonce', result.dpop_nonce);
        delete result.dpop_nonce;
      }

      return c.json(result, 201);
    } catch (error: any) {
      console.error('[PAR] Error:', error);
      return c.json({
        error: 'invalid_request',
        error_description: error.message
      }, 400);
    }
  };
};
