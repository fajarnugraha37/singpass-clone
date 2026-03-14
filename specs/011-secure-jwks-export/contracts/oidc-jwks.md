# Contract: Public JSON Web Key Set (JWKS)

This document defines the contract for the public JWKS endpoint located at `/.well-known/keys`.

## Endpoint

- **Path**: `/.well-known/keys`
- **Method**: `GET`
- **Success Response**:
  - **Code**: `200 OK`
  - **Content-Type**: `application/json`
  - **Body**: A JWK Set object.

## JWK Set Object Structure

A JSON object with a `keys` member.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `keys` | Array of Public JWK objects | An array of cryptographic keys. May be empty. |

### Example JWK Set

```json
{
  "keys": [
    {
      "kty": "EC",
      "crv": "P-256",
      "x": "MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4",
      "y": "4Etl6SRW2YiLUrN5vfvVHnaq7LWhqZqSq_j9y_k6GIM",
      "use": "sig",
      "kid": "primary-ec-key",
      "alg": "ES256"
    }
  ]
}
```

## Public JWK Object

Each object in the `keys` array MUST adhere to the following structure. This contract explicitly forbids the inclusion of any private key parameters.

### Elliptic Curve (`EC`) Public Key Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `kty` | String | **Required.** Key Type. MUST be `"EC"`. |
| `crv` | String | **Required.** Curve. e.g., `"P-256"`. |
| `x` | String | **Required.** X Coordinate. Base64URLUInt-encoded. |
| `y` | String | **Required.** Y Coordinate. Base64URLUInt-encoded. |
| `use` | String | *Optional.* Public Key Use (e.g., `"sig"` for signature). |
| `kid` | String | *Optional.* Key ID. |
| `alg` | String | *Optional.* Algorithm (e.g., `"ES256"`). |

### Forbidden Parameters

The following parameters, which are part of a private JWK, **MUST NOT** be present in the response.

| Parameter | Description |
| :--- | :--- |
| `d` | The private exponent of the key. |
| `p`, `q`, `dp`, `dq`, `qi` | RSA-specific private components. |
