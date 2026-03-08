# 2FA / OTP Verification Endpoint Flow

This diagram illustrates the function call flow when a user submits their secondary verification factor (e.g., OTP), completing the login flow and triggering the issuance of an authorization code.

```mermaid
sequenceDiagram
    participant Frontend
    participant HonoApp as app.post('/api/auth/2fa')
    participant AuthRouter as authRouter.post('/2fa')
    participant Validator as ZodValidator
    participant AuthController as twoFactor
    participant 2FAUseCase as Validate2FAUseCase
    participant GenAuthUseCase as GenerateAuthCodeUseCase
    participant SessionRepo as DrizzleAuthSessionRepository
    participant ParRepo as DrizzlePARRepository
    participant AuthCodeRepo as DrizzleAuthorizationCodeRepository
    participant AuditService as DrizzleSecurityAuditService
    
    Frontend->>HonoApp: POST /api/auth/2fa (OTP code)
    HonoApp->>AuthRouter: Route Request
    AuthRouter->>Validator: Validate POST body
    Validator-->>AuthRouter: Validated body
    AuthRouter->>AuthController: (Context)
    
    %% Session Retrieval
    AuthController->>AuthController: getCookie('vibe_auth_session')
    AuthController->>2FAUseCase: execute({sessionId, otp})
    2FAUseCase->>SessionRepo: getById(sessionId)
    SessionRepo-->>2FAUseCase: Active Session Record
    
    %% OTP Validation
    2FAUseCase->>2FAUseCase: Validate OTP (mocked or DB check)
    
    %% Update Session
    2FAUseCase->>SessionRepo: update(session: status=COMPLETED)
    SessionRepo-->>2FAUseCase: Record Updated
    
    %% Audit Logging
    2FAUseCase->>AuditService: logEvent(2FA_SUCCESS)
    AuditService-->>2FAUseCase: logged
    
    %% Auth Code Generation Sequence
    Note over 2FAUseCase, GenAuthUseCase: Initiating final Authorization Code generation
    2FAUseCase->>GenAuthUseCase: execute({sessionId})
    
    %% GenAuthUseCase dependencies
    GenAuthUseCase->>SessionRepo: getById(sessionId)
    SessionRepo-->>GenAuthUseCase: Completed Session Record
    GenAuthUseCase->>ParRepo: getBySession(sessionId)
    ParRepo-->>GenAuthUseCase: Original PAR Record
    
    %% Save Code
    GenAuthUseCase->>AuthCodeRepo: save(authCodeRecord)
    AuthCodeRepo-->>GenAuthUseCase: Code RecordCreated
    
    %% Audit Logging for Auth Code
    GenAuthUseCase->>AuditService: logEvent(AUTH_CODE_GENERATED)
    AuditService-->>GenAuthUseCase: logged
    
    %% Output Final Redirect URI
    GenAuthUseCase-->>2FAUseCase: {redirectUri: "https://client-app/cb?code=..."}
    
    %% Result propagate to controller
    2FAUseCase-->>AuthController: {success, redirect_uri}
    
    %% Controller Result
    AuthController-->>AuthRouter: JSON response
    AuthRouter-->>HonoApp: JSON response
    HonoApp-->>Frontend: 200 OK
```
