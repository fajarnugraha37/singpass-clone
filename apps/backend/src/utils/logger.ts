/**
 * Hardened Logger Utility.
 * Provides consistent secret masking for all application logs.
 */

const SECRET_KEYS = [
  'password', 'client_secret', 'client_assertion', 'code', 'token', 
  'access_token', 'refresh_token', 'otp', 'otp_code', 'private_key',
  'code_verifier', 'code_challenge', 'id_token'
];

/**
 * Recursively masks sensitive keys in an object.
 */
export function mask(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Check if the string itself looks like a JWT or PEM
    if (data.startsWith('eyJ') || data.includes('-----BEGIN')) {
      return '***MASKED_SECRET***';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => mask(item));
  }

  if (typeof data === 'object') {
    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SECRET_KEYS.some(sk => lowerKey.includes(sk))) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = mask(value);
      }
    }
    return masked;
  }

  return data;
}

export const logger = {
  info: (message: string, details?: any) => {
    console.info(JSON.stringify({ level: 'INFO', message, details: mask(details), timestamp: new Date().toISOString() }));
  },
  warn: (message: string, details?: any) => {
    console.warn(JSON.stringify({ level: 'WARN', message, details: mask(details), timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'ERROR', message, error: mask(error), timestamp: new Date().toISOString() }));
  }
};
