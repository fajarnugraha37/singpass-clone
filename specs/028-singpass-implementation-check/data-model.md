# Data Model: Singpass Implementation Conformance Auditor

The auditor tool maintains state internally during its execution. No persistent database is required.

## Core Entities

### 1. `AuditorConfig`

Represents the target configuration and parameters for the run.

- `targetDiscoveryUrl`: string (e.g., `https://localhost/.well-known/openid-configuration`)
- `clientId`: string
- `clientAssertionType`: 'client_secret' | 'private_key_jwt'
- `clientSecret`?: string
- `clientPrivateKey`?: string (PEM/JWK format)
- `redirectUri`: string
- `requestedScopes`: string[]
- `useDpop`: boolean
- `myinfoConfig`?: MyInfoVerificationConfig

### 2. `AuditReport`

The final output of the auditor.

- `timestamp`: string (ISO 8601)
- `target`: string
- `overallStatus`: 'PASS' | 'PARTIAL' | 'FAIL'
- `summary`: string
- `topFindings`: AuditFinding[] (up to 3)
- `checks`: AuditFinding[]

### 3. `AuditFinding`

An individual test evaluation.

- `id`: string (e.g., `CH-001`)
- `title`: string
- `status`: 'PASS' | 'PARTIAL' | 'FAIL' | 'MANUAL'
- `finding`: string
- `evidence`: string (JSON stringified data, headers, or decoded tokens)
- `remediation`?: string
- `referenceUrl`?: string

### 4. `AuthSessionState`

Transient state maintained during the OIDC flow execution.

- `state`: string
- `nonce`: string
- `codeVerifier`: string
- `codeChallenge`: string
- `requestUri`?: string
- `authorizationCode`?: string
- `accessToken`?: string
- `idToken`?: string
- `dpopNonce`?: string
