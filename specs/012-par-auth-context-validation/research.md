# Research: PAR authentication_context_type Validation

## Domain Knowledge & Best Practices

### Singpass PAR Specifics
Per Singpass technical specifications, Pushed Authorization Requests (PAR) for "Login" apps must include specific transaction context to mitigate fraud. This is an extension of the standard OIDC PAR flow.

### FAPI 2.0 Compliance
The project aims for FAPI 2.0 compliance, which PAR is a core part of. Adding validation for these parameters ensures that the system can be used by regulated entities (like Banks and Government agencies) that require strict transaction signing context.

## Technical Context & Decisions

### 1. Where to store the Enum values?
- **Decision**: Define the `AuthenticationContextType` enum and a constant array of valid values in `packages/shared/src/config.ts`.
- **Rationale**: These values are part of the contract between the client and the server and should be available to both if needed (e.g., for client-side validation in a SDK).

### 2. How to distinguish Client App Types?
- **Decision**: Add an `appType` field to the `ClientConfig` interface in `apps/backend/src/core/domain/client_registry.ts`.
- **Enum values**: `'Login' | 'Myinfo'`.
- **Rationale**: This is the cleanest way to support conditional validation in the business logic layer (Use Cases).

### 3. Zod Schema Updates
- **Decision**: Update `parRequestSchema` in `packages/shared/src/config.ts` to include `authentication_context_type` and `authentication_context_message` as optional fields with appropriate validations (regex for message, enum for type).
- **Rationale**: Zod handles the initial structural and format validation, while the Use Case handles the domain-specific conditional validation (mandatory for Login apps).

### 4. Implementation in RegisterParUseCase
- **Decision**: Add logic to check the client's `appType` and throw errors if the mandatory fields are missing for Login apps or if they are present for Myinfo apps.
- **Rationale**: This ensures business rules are enforced at the domain level, not just the transport level.

## Alternatives Considered

- **Alternative 1: Separate Endpoints**: Having `/par/login` and `/par/myinfo`.
  - **Rejected**: Violates OIDC standards which specify a single `/par` endpoint.
- **Alternative 2: Purely JSON Schema in DB**: Only validate when the data is retrieved.
  - **Rejected**: Fails fast is a security requirement. Validation must happen at the point of entry (PAR endpoint).

## Dependencies & Libraries

- **Zod**: Used for schema validation. Already in the project.
- **Drizzle**: Used for persistence. `par_requests.payload` is already JSON, so no schema migration is needed for storage, but the TypeScript interfaces need updates.
