# Internal API Contracts: Singpass QR Authentication Flow

## Hono RPC Endpoints

These endpoints are used for type-safe communication between the Astro frontend and the Hono backend.

### 1. `POST /auth/singpass/qr/init`
Initiates a new QR authentication session.

**Request**:
- Headers: `DPoP` (Optional, as recommended for FAPI)

**Response (201 Created)**:
```json
{
  "sessionId": "uuid",
  "qrUrl": "https://stg-id.singpass.gov.sg/auth?client_id=...&request_uri=...",
  "expiresIn": 60,
  "state": "random_string"
}
```

### 2. `GET /auth/singpass/qr/status/:sessionId`
Polls for the current status of the authentication session.

**Request Parameters**:
- `sessionId`: The ID returned from the `/init` endpoint.

**Response (200 OK)**:
```json
{
  "status": "PENDING" | "AUTHORIZED" | "CANCELLED" | "EXPIRED" | "ERROR",
  "redirectUrl": "/dashboard" // Only present if status is AUTHORIZED
}
```

**Long Polling Behavior**:
- The server will hold the connection for up to 30 seconds if the status is `PENDING`.
- If the status changes to `AUTHORIZED` or `CANCELLED` within this window, the response is returned immediately.
- If the timeout is reached, the response returns `status: PENDING`.

---

## External Singpass Callback Contract

This endpoint is called by the Singpass OIDC server after the user authorizes on their phone.

### `GET /auth/singpass/callback`

**Query Parameters**:
- `code`: The authorization code (on success).
- `state`: The state parameter passed in the PAR request.
- `error`: Error code (on failure).
- `error_description`: Human-readable error message.

**Logic**:
- Locate the `QRSession` in the DB by matching `state`.
- Update the `status` based on whether `code` or `error` is present.
- Store the `code` if successful.
- Redirect the browser to a simple "Authorization Complete" page (or just close the tab if applicable, though for QR login, the polling tab on the desktop will detect the status change).
