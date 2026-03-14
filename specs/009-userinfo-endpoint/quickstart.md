# Quickstart: UserInfo Endpoint

## Prerequisites
- Valid `access_token` obtained from `/token` endpoint.
- Client private key corresponding to the public key used during DPoP binding.
- Client private encryption key (matching the public `enc` key in the client's JWKS).

## Integration Steps

### 1. Generate DPoP Proof
Generate a DPoP proof JWT for the `/userinfo` request.
```typescript
const dpop = await new jose.SignJWT({
  htm: 'GET',
  htu: 'https://id.singpass.gov.sg/userinfo',
  jti: crypto.randomUUID()
})
  .setProtectedHeader({ alg: 'ES256', jwk: clientPublicKey, typ: 'dpop+jwt' })
  .setIssuedAt()
  .sign(clientPrivateKey);
```

### 2. Make the Request
```bash
curl -X GET https://id.singpass.gov.sg/userinfo \
  -H "Authorization: DPoP <access_token>" \
  -H "DPoP: <dpop_proof>"
```

### 3. Handle the Response
The response is a raw JWE.
1. **Decrypt** using Client's private encryption key.
2. **Verify Signature** using Server's public signing key (from `/.well-known/keys`).
3. **Parse** the JSON payload to access `person_info`.

## Troubleshooting
- **401 `invalid_dpop_proof`**: Check `htm` and `htu` in the DPoP proof. Ensure it matches exactly.
- **401 `invalid_token`**: Token may be expired (30m) or revoked.
- **Decryption Fail**: Ensure you are using the private key corresponding to the `kid` in the JWE header.
