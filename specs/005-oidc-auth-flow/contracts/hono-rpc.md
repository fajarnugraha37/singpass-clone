# Hono RPC Contracts: OIDC Auth Flow

This defines the internal API contracts between the Astro frontend and the Hono backend for the authentication flow.

## POST `/api/auth/login`
Validates primary credentials (Username/Password) and advances the session state.

**Request Body**:
```typescript
{
  username: string; // The user's NRIC/ID
  password: string; // The user's password
}
```

**Response (Success)**:
```typescript
{
  success: true;
  next_step: '2fa';
}
```

**Response (Error)**:
```typescript
{
  success: false;
  error: string; // e.g., 'Invalid credentials' or 'Session expired'
}
```

## POST `/api/auth/2fa`
Validates the simulated SMS OTP and completes the authentication, returning the final redirect URI with code/state.

**Request Body**:
```typescript
{
  otp: string; // 6-digit OTP code
}
```

**Response (Success)**:
```typescript
{
  success: true;
  redirect_uri: string; // e.g., 'https://client.example.com/callback?code=spl_xyz123...&state=abc'
}
```

**Response (Error)**:
```typescript
{
  success: false;
  error: string; // e.g., 'Invalid OTP' or 'Session expired'
}
```
