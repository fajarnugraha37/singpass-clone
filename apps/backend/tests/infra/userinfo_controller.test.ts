import { describe, it, expect, mock, afterEach } from 'bun:test';
import { getUserInfo } from '../../src/infra/http/controllers/userinfo.controller';
import { Context } from 'hono';

describe('UserInfoController', () => {
  const mockUseCase: any = {
    execute: mock(async () => 'signed-jwe'),
  };
  const issuer = 'https://issuer.com';
  const controller = getUserInfo(mockUseCase, issuer);

  afterEach(() => {
    mockUseCase.execute.mockClear();
  });

  it('should return 401 for invalid DPoP proof error from use case', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('invalid_dpop_proof: Key mismatch');
    });

    const c = {
      req: {
        header: (name: string) => {
          if (name === 'Authorization') return 'DPoP valid-token';
          if (name === 'DPoP') return 'valid-proof';
          return undefined;
        },
        method: 'GET',
        url: 'http://localhost/userinfo',
      },
      json: (data: any, status: number) => ({ data, status }),
    } as unknown as Context;

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.data.error).toBe('invalid_dpop_proof');
    expect(res.data.error_description).toBe('Key mismatch');
  });

  it('should return 401 for invalid token error from use case', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('invalid_token');
    });

    const c = {
      req: {
        header: (name: string) => {
          if (name === 'Authorization') return 'DPoP valid-token';
          if (name === 'DPoP') return 'valid-proof';
          return undefined;
        },
        method: 'GET',
        url: 'http://localhost/userinfo',
      },
      json: (data: any, status: number) => ({ data, status }),
    } as unknown as Context;

    const res: any = await controller(c);
    expect(res.status).toBe(401);
    expect(res.data.error).toBe('invalid_token');
  });

  it('should return 500 for unknown error from use case', async () => {
    mockUseCase.execute.mockImplementationOnce(async () => {
      throw new Error('Something went wrong');
    });

    const c = {
      req: {
        header: (name: string) => {
          if (name === 'Authorization') return 'DPoP valid-token';
          if (name === 'DPoP') return 'valid-proof';
          return undefined;
        },
        method: 'GET',
        url: 'http://localhost/userinfo',
      },
      json: (data: any, status: number) => ({ data, status }),
    } as unknown as Context;

    const res: any = await controller(c);
    expect(res.status).toBe(500);
    expect(res.data.error).toBe('server_error');
  });
});
