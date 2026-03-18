import { describe, it, expect, beforeAll } from 'bun:test';
import * as jose from 'jose';
import { JoseCryptoService } from '../../src/infra/adapters/jose_crypto';
import { DrizzleServerKeyManager } from '../../src/infra/adapters/db/drizzle_key_manager';
import { DrizzleClientRegistry } from 'src/infra/adapters/client_registry';
import { DrizzleSecurityAuditService } from 'src/infra/adapters/security_logger';

describe('JoseCryptoService: signAndEncrypt', () => {
  let cryptoService: JoseCryptoService;
  let clientPrivateKey: jose.CryptoKey;
  let clientPublicKey: jose.JWK;
  let serverPublicKey: jose.JWK;
  let serverKeyId: string;

  beforeAll(async () => {
    process.env.SERVER_KEY_ENCRYPTION_SECRET = '00'.repeat(32);
    const keyManager = new DrizzleServerKeyManager();
    cryptoService = new JoseCryptoService(keyManager, new DrizzleClientRegistry(), new DrizzleSecurityAuditService());
    
    // 1. Setup Server Key
    const serverKey = await cryptoService.generateKeyPair();
    serverPublicKey = serverKey.publicKey;
    serverKeyId = serverKey.id;

    // 2. Setup Client Encryption Key (ECDH-ES+A256KW)
    const { publicKey, privateKey } = await jose.generateKeyPair('ECDH-ES+A256KW', { extractable: true });
    clientPrivateKey = privateKey;
    clientPublicKey = await jose.exportJWK(publicKey);
    clientPublicKey.kid = 'client-enc-key';
    clientPublicKey.use = 'enc';
    clientPublicKey.alg = 'ECDH-ES+A256KW';
  });

  it('should generate a valid JWS-in-JWE (Signed then Encrypted) payload', async () => {
    const payload = {
      sub: 'user-123',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
    };

    // Act: Sign and Encrypt
    const jwe = await cryptoService.signAndEncrypt(payload, clientPublicKey, serverKeyId);
    expect(jwe).toBeDefined();
    expect(typeof jwe).toBe('string');
    expect(jwe.split('.').length).toBe(5); // JWE has 5 parts

    // Assert: Decrypt (Outer Layer)
    const { plaintext } = await jose.compactDecrypt(
      jwe,
      clientPrivateKey,
      {
        keyManagementAlgorithms: ['ECDH-ES+A256KW'],
        contentEncryptionAlgorithms: ['A256GCM'],
      }
    );

    const jws = new TextDecoder().decode(plaintext);
    expect(jws).toBeDefined();
    expect(jws.split('.').length).toBe(3); // JWS has 3 parts

    // Assert: Verify Signature (Inner Layer)
    const serverKey = await jose.importJWK(serverPublicKey, 'ES256');
    const { payload: verifiedPayload } = await jose.jwtVerify(jws, serverKey, {
      algorithms: ['ES256'],
    });

    expect(verifiedPayload.sub).toBe(payload.sub);
    expect(verifiedPayload.name).toBe(payload.name);
  });
});
