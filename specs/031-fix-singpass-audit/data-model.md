# Data Model: Remediate Singpass Compliance Audit Findings

## Entities

### User
Represents an identity authenticated by the system.
- `id`: string (UUID)
- `nric`: string (Unique, encrypted)
- `name`: string
- `email`: string (Optional)
- `mobileno`: string (Optional)
- `account_type`: enum ('standard', 'foreign'). Default: 'standard'.
- `created_at`: date
- `updated_at`: date

### PAR Request
Represents the pushed authorization state.
- `requestUri`: string (Unique identifier for the PAR request)
- `clientId`: string
- `dpopJkt`: string (DPoP binding thumbprint)
- `payload`: JSON (All parameters passed during PAR initiation)
  - New fields: `redirect_uri_https_type`, `app_launch_url`
- `expiresAt`: date (Set to 60s from creation)

### DPoP Nonce
A transient entity used to ensure freshness of DPoP proofs.
- `nonce`: string (Randomly generated)
- `clientId`: string
- `expiresAt`: date (e.g., 2 minutes)

## Validation Rules
- **State**: `min(30)`
- **Nonce**: `min(30)`
- **PAR TTL**: 60 seconds.
- **DPoP-Nonce**: Must be returned in headers for PAR and Token responses.
- **Account Type**: Must be propagated correctly to ID Token claims.
