import { expect, test, describe, beforeEach, spyOn } from 'bun:test';
import { DPoPValidator, JtiStore } from '../../src/core/utils/dpop_validator';
import * as jose from 'jose';

describe('DPoPValidator', () => {
  let jtiStore: JtiStore;
  let validator: DPoPValidator;
  let keyPair: jose.GenerateKeyPairResult;
  let jwk: jose.JWK;

  beforeEach(async () => {
    jtiStore = {
      isUsed: async () => false,
      markUsed: async () => {},
    };
    validator = new DPoPValidator(jtiStore);
    keyPair = await jose.generateKeyPair('ES256');
    jwk = await jose.exportJWK(keyPair.publicKey);
  });

  async function createProof(payload: any, headerOverrides = {}) {
    const jwt = new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256', typ: 'dpop+jwt', jwk, ...headerOverrides });
    
    if (payload.iat === undefined) {
      jwt.setIssuedAt();
    }
    
    return await jwt.sign(keyPair.privateKey);
  }

  test('should validate a valid DPoP proof', async () => {
    const proof = await createProof({
      htm: 'POST',
      htu: 'https://server.example.com/token',
      jti: 'test-jti',
    });

    const result = await validator.validate('client-1', {
      proof,
      method: 'POST',
      url: 'https://server.example.com/token',
    });

    expect(result.isValid).toBe(true);
    expect(result.jkt).toBeDefined();
  });

  describe('HTU (HTTP URI) Validation', () => {
    test('should fail if htu is missing', async () => {
      const proof = await createProof({
        htm: 'POST',
        jti: 'test-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_htu');
    });

    test('should fail if htu does not match exactly (different path)', async () => {
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/wrong-path',
        jti: 'test-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_htu');
    });

    test('should fail if htu is missing trailing slash but request has it', async () => {
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'test-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token/',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_htu');
    });

    test('should ignore query and fragment in request URL for htu check', async () => {
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'test-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token?query=1#frag',
      });

      expect(result.isValid).toBe(true);
    });

    test('should fail if htu in proof contains query parameters', async () => {
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token?query=1',
        jti: 'test-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_htu');
    });
  });

  describe('JTI (JWT ID) Replay Protection', () => {
    test('should fail if jti is missing', async () => {
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('missing_jti');
    });

    test('should fail if jti has already been used', async () => {
      spyOn(jtiStore, 'isUsed').mockImplementation(async () => true);

      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'reused-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('jti_reused');
    });

    test('should mark jti as used after successful validation', async () => {
      const markUsedSpy = spyOn(jtiStore, 'markUsed');

      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'new-jti',
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(true);
      expect(markUsedSpy).toHaveBeenCalled();
      const args = markUsedSpy.mock.calls[0];
      expect(args[0]).toBe('new-jti');
      expect(args[1]).toBe('client-1');
      expect(args[2]).toBeInstanceOf(Date);
    });
  });

  describe('IAT (Issued At) Tolerance', () => {
    test('should fail if proof is too old', async () => {
      const now = Math.floor(Date.now() / 1000);
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'old-jti',
        iat: now - 300, // 5 minutes ago
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_iat');
    });

    test('should fail if proof is too far in future', async () => {
      const now = Math.floor(Date.now() / 1000);
      const proof = await createProof({
        htm: 'POST',
        htu: 'https://server.example.com/token',
        jti: 'future-jti',
        iat: now + 300, // 5 minutes in future
      });

      const result = await validator.validate('client-1', {
        proof,
        method: 'POST',
        url: 'https://server.example.com/token',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_iat');
    });
  });
});
