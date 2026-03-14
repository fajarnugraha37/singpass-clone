# Feature Specification: PAR authentication_context_type Validation

**Feature Branch**: `012-par-auth-context-validation`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "PAR `authentication_context_type` Validation Finding: #2 (🟡 Medium) ### Problem The `parRequestSchema` does not include `authentication_context_type`, which is mandatory for Login apps per the Singpass spec. ### Doc Reference `docs/singpass/technical-specifications/integration-guide/1.-authorization-request.md` → Singpass-Specific Parameters section. ### Valid Enum Values (from docs) ``` APP_AUTHENTICATION_DEFAULT, APP_PAYMENT_DEFAULT, APP_ACCOUNT_PASSWORD_CHANGE_DEFAULT, APP_ACCOUNT_PASSWORD_RESET_DEFAULT, APP_ACCOUNT_DETAILS_CHANGE_DEFAULT, APP_ONBOARDING_DEFAULT, BANK_CASA_OPENING, BANK_FUNDS_TRANSFER_LOCAL, ... ``` ### Acceptance Criteria 1. `parRequestSchema` MUST accept an optional `authentication_context_type` string field. 2. `parRequestSchema` MUST accept an optional `authentication_context_message` string field (max 100 chars, allowed chars: `A-Za-z0-9 .,-@'!()`). 3. When the client is a Login app, `authentication_context_type` MUST be required (throw `invalid_request` if missing). 4. The field value MUST be stored in the PAR payload for later reference."

## Clarifications

### Session 2026-03-14
- Q: How should the system handle a Myinfo app that sends `authentication_context_type` or `authentication_context_message`? → A: Reject with `invalid_request`.
- Q: What field names should be used in the PAR Payload entity for these context fields? → A: Use exact names `authentication_context_type` and `authentication_context_message`.
- Q: Is `authentication_context_type` required for ALL Login app PAR requests? → A: Yes, mandatory for all Login app requests.
- Q: Should the system provide detailed error descriptions for validation failures? → A: Yes, return detailed `error_description` in the 400 response.
- Q: Where should these parameters be included in the PAR request body? → A: Top-level parameters (at the same level as `scope`, `state`, etc.).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Login App Transaction (Priority: P1)

As a developer of a Login app, I want to provide a specific transaction context in my PAR request so that Singpass can display anti-fraud information to the user and ensure the transaction is legitimate.

**Why this priority**: High. This is a mandatory requirement for Login apps in the Singpass production environment.

**Independent Test**: Can be tested by sending a PAR request with `authentication_context_type` and verifying that the request is accepted and the values are stored in the PAR payload.

**Acceptance Scenarios**:

1. **Given** a registered "Login" type client, **When** it sends a PAR request containing a valid `authentication_context_type` (e.g., `APP_AUTHENTICATION_DEFAULT`), **Then** the system accepts the request and returns a `request_uri`.
2. **Given** a registered "Login" type client, **When** it sends a PAR request WITHOUT `authentication_context_type`, **Then** the system rejects the request with a HTTP 400 `invalid_request` error.

---

### User Story 2 - Transaction Context Message (Priority: P2)

As a developer of a Login app, I want to provide a custom message to be displayed to the user during authentication so they understand exactly what they are authorizing.

**Why this priority**: Medium. Enhances user trust and clarity, though optional according to the spec.

**Independent Test**: Can be tested by sending a PAR request with `authentication_context_message` and verifying that it is validated and stored correctly.

**Acceptance Scenarios**:

1. **Given** a registered "Login" type client, **When** it sends a PAR request with a valid `authentication_context_message` (e.g., "Authorize login to Vibe Auth"), **Then** the system accepts the request.
2. **Given** a registered "Login" type client, **When** it sends a PAR request with a message exceeding 100 characters OR containing invalid characters (e.g., `$`), **Then** the system rejects the request with `invalid_request`.

---

### User Story 3 - Myinfo App Compatibility (Priority: P3)

As a developer of a Myinfo app, I want my existing PAR requests to continue working without being forced to provide authentication context parameters.

**Why this priority**: Medium. Ensures backward compatibility and correct behavior for different app types.

**Independent Test**: Can be tested by sending a PAR request from a "Myinfo" type client without these parameters and verifying success.

**Acceptance Scenarios**:

1. **Given** a registered "Myinfo" type client, **When** it sends a PAR request WITHOUT `authentication_context_type`, **Then** the system accepts the request (as it is not mandatory for non-Login apps).

### Edge Cases

- **Invalid Context Type**: How does the system handle a `authentication_context_type` that is a valid string but not in the predefined enum list? (Requirement: MUST reject with `invalid_request`).
- **Boundary Message Length**: What happens when `authentication_context_message` is exactly 100 characters? (Requirement: MUST accept).
- **Exceeded Message Length**: What happens when `authentication_context_message` is 101 characters? (Requirement: MUST reject).
- **Special Character Set**: How does the system handle a message containing all allowed special characters `.,-@'!()`? (Requirement: MUST accept).
- **Prohibited Characters**: How does the system handle a message containing emojis or other non-allowed symbols (e.g., `#`, `$`, `%`)? (Requirement: MUST reject).
- **Client Type Mismatch**: What happens if a Myinfo app sends a context message? (Requirement: Singpass says it is allowed only for Login apps, so we should reject it for Myinfo apps to ensure compliance).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `parRequestSchema` MUST be updated to include `authentication_context_type` and `authentication_context_message` as optional top-level parameters in the request body (at the same level as `scope`, `state`, etc.).
- **FR-002**: System MUST determine if a client is a "Login app" or "Myinfo app" based on client configuration.
- **FR-003**: System MUST enforce that `authentication_context_type` is present and non-empty for all "Login app" PAR requests.
- **FR-004**: System MUST validate that `authentication_context_type` (if provided) matches one of the predefined enum values.
- **FR-005**: System MUST validate that `authentication_context_message` (if provided) is at most 100 characters long.
- **FR-006**: System MUST validate that `authentication_context_message` (if provided) contains only the following characters: `A-Z`, `a-z`, `0-9`, space, `.`, `,`, `-`, `@`, `'`, `!`, `(`, `)`.
- **FR-007**: System MUST store both `authentication_context_type` and `authentication_context_message` in the PAR session/payload data for later retrieval during the authorization step.
- **FR-008**: System MUST return an OIDC-compliant error response (`invalid_request`) with a detailed `error_description` (e.g., "authentication_context_type is mandatory for Login apps") when any validation fails.
- **FR-009**: System MUST reject PAR requests from "Myinfo app" clients if they contain `authentication_context_type` or `authentication_context_message`.

### Key Entities

- **Client**: Represents the third-party application. Includes metadata distinguishing between "Login" and "Myinfo" types.
- **PAR Payload**: The persistent data structure representing a Pushed Authorization Request. It MUST store `authentication_context_type` and `authentication_context_message` as optional string fields.

### Predefined Enum Values (authentication_context_type)

- **CPF Transactions**: `CPF_CHANGE_PAYMENT_MODE`, `CPF_CHANGE_DAILY_WITHDRAWAL_LIMIT`, `CPF_PROFILE_UPDATE`, `CPF_LINK_BANK_ACCOUNT`, `CPF_FUNDS_TRANSFER`
- **Banking**: `BANK_CASA_OPENING`, `BANK_CASA_INITIAL_USAGE`, `BANK_CARD_APPLICATION`, `BANK_CARD_INITIAL_USAGE`, `BANK_LOAN_APPLICATION`, `BANK_ADD_LOCAL_RECEIPIENT`, `BANK_ADD_OVERSEAS_RECIPIENT`, `BANK_INCREASE_TRANSFER_LIMIT`, `BANK_REPORT_FRAUD_SUSPICIOUS_ACTIVITY`, `BANK_FUNDS_TRANSFER_LOCAL`, `BANK_REMIT_MONEY_OVERSEAS`, `BANK_REPORT_LOST_CARD`, `BANK_CHANGE_NOTIFICATION_METHOD`, `BANK_INCREASE_CREDIT_CARD_LIMIT`, `BANK_REQUEST_CASH_ADVANCE`, `BANK_INCREASE_INFLOW_OUTFLOW`, `BANK_ACTIVATE_DORMANT_ACCOUNT`, `BANK_LOGIN_NEW_DEVICE`, `BANK_LOGIN_UNFAMILIAR_IP`, `BANK_UPDATE_USER_INFORMATION`, `BANK_NEW_DEVICE_REGISTRATION`, `BANK_UNLOCK_MONEY_LOCK`, `BANK_GOOGLE_PAY_APPLE_PAY_CARD_ONBOARDING`
- **Other Financial Institutions**: `FI_ACCOUNT_OPENING`, `FI_LINK_BANK_ACCOUNT`, `FI_INCREASE_TRANSFER_LIMIT`, `FI_INCREASE_WITHDRAWAL_LIMIT`, `FI_INITIATE_DEPOSIT`
- **Telcos**: `TELCO_SIM_CARD_APPLICATION`, `TELCO_SIM_CARD_ACTIVATION`, `TELCO_CHANGE_ACCOUNT_DETAILS`, `TELCO_ACTIVATE_ROAMING`, `TELCO_CHANGE_NOTIFICATION_METHOD`
- **Others**: `APP_AUTHENTICATION_DEFAULT`, `APP_PAYMENT_DEFAULT`, `APP_ACCOUNT_PASSWORD_CHANGE_DEFAULT`, `APP_ACCOUNT_PASSWORD_RESET_DEFAULT`, `APP_ACCOUNT_DETAILS_CHANGE_DEFAULT`, `APP_ONBOARDING_DEFAULT`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of PAR requests from Login apps missing `authentication_context_type` result in an `invalid_request` error.
- **SC-002**: 100% of PAR requests with an invalid message (length > 100 or invalid chars) result in an `invalid_request` error.
- **SC-003**: Validated authentication context data is correctly persisted and can be retrieved from the PAR session by the Authorization endpoint.
- **SC-004**: No regressions for Myinfo apps (existing flows without these parameters continue to work).
