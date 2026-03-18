import { clientConfigSchema, parRequestSchema } from '../../../../../packages/shared/src/config';
import { validateUrlSafe } from '../auth/validation';

export class AuthValidator {
  /**
   * Validates a Client configuration for compliance.
   * Enforces IP restrictions on redirectUris and siteUrl.
   */
  static validateClient(config: any): { success: boolean; error?: string } {
    const result = clientConfigSchema.safeParse(config);
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors[0].message 
      };
    }

    // Additional manual checks if needed beyond Zod
    const isDev = process.env.NODE_ENV !== 'production';
    
    for (const uri of result.data.redirectUris) {
      if (!validateUrlSafe(uri, isDev)) {
        return { success: false, error: `Invalid or IP-based redirect_uri: ${uri}` };
      }
    }

    if (result.data.siteUrl && !validateUrlSafe(result.data.siteUrl, isDev)) {
      return { success: false, error: `Invalid or IP-based site_url: ${result.data.siteUrl}` };
    }

    return { success: true };
  }

  /**
   * Validates a PAR request for compliance.
   */
  static validateParRequest(request: any): { success: boolean; error?: string } {
    const result = parRequestSchema.safeParse(request);
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors[0].message 
      };
    }
    return { success: true };
  }
}
