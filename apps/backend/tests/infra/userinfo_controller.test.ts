import { describe, it, expect, mock, afterEach } from 'bun:test';
import { getUserInfo } from '../../src/infra/http/controllers/userinfo.controller';
import { Context } from 'hono';

describe('UserInfoController', () => {
  const mockUseCase: any = {
    execute: mock(async () => 'signed-jwe'),
  };
  const issuer = 'https://issuer.com';
  const controller = getUserInfo(mockUseCase, issuer);

  const createMockContext = (headers: Record<string, string> = {}) => {
    const resHeaders: Record<string, string> = {};
    return {
      req: {
        header: (name: string) => headers[name],
        method: 'GET',
        url: 'http://localhost/userinfo',
      },
      header: (name: string, value: string) => {
        resHeaders[name] = value;
      },
      json: (data: any, status: number, headers?: Record<string, string>) => {
        if (headers) {
          Object.assign(resHeaders, headers);
        }
        return { data, status, headers: resHeaders };
      },
      text: (data: string, status: number = 200) => {
        return { data, status, headers: resHeaders };
      },
    } as unknown as Context;
  };

  afterEach(() => {
    mockUseCase.execute.mockClear();
  });

  it('should return 401 for invalid DPoP proof error from use case', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('invalid_dpop_proof: Key mismatch');
    });

    const c = createMockContext({
      'Authorization': 'DPoP valid-token',
      'DPoP': 'valid-proof'
    });

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.data.error).toBe('invalid_dpop_proof');
    expect(res.data.error_description).toBe('Key mismatch');
    expect(res.headers['WWW-Authenticate']).toBe('DPoP error="invalid_dpop_proof", error_description="Key mismatch"');
  });

  it('should return 401 for invalid token error from use case', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('invalid_token');
    });

    const c = createMockContext({
      'Authorization': 'DPoP valid-token',
      'DPoP': 'valid-proof'
    });

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.data.error).toBe('invalid_token');
    expect(res.headers['WWW-Authenticate']).toBe('DPoP error="invalid_token", error_description="The access token is invalid or has expired"');
  });

  it('should return 401 with correct WWW-Authenticate header when token is expired', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('invalid_token');
    });

    const c = createMockContext({
      'Authorization': 'DPoP expired-token',
      'DPoP': 'valid-proof'
    });

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.headers['WWW-Authenticate']).toContain('error="invalid_token"');
  });

  it('should return 500 for unknown error from use case', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('Something went wrong');
    });

    const c = createMockContext({
      'Authorization': 'DPoP valid-token',
      'DPoP': 'valid-proof'
    });

    const res: any = await controller(c);
    expect(res.status).toBe(500);
    expect(res.data.error).toBe('server_error');
  });

  it('should return 401 and WWW-Authenticate for missing Authorization header', async () => {
    const c = createMockContext({});

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.data.error).toBe('invalid_request');
    expect(res.headers['WWW-Authenticate']).toBe('DPoP error="invalid_request", error_description="Missing or invalid Authorization header"');
  });

  it('should return 401 and WWW-Authenticate for missing DPoP header', async () => {
    const c = createMockContext({
      'Authorization': 'DPoP valid-token'
    });

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.data.error).toBe('invalid_dpop_proof');
    expect(res.headers['WWW-Authenticate']).toBe('DPoP error="invalid_dpop_proof", error_description="Missing DPoP header"');
  });
});
