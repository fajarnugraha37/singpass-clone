---
description: "Task list for Singpass Implementation Conformance Auditor"
---

# Tasks: Singpass Implementation Conformance Auditor

**Input**: Design documents from `/specs/028-singpass-implementation-check/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create `packages/conformance/package.json` with dependencies (`jose`, `typescript`, `@types/bun`)
- [ ] T002 [P] Create `packages/conformance/tsconfig.json` for the new package

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T003 [P] Create `packages/conformance/src/utils/types.ts` for Data Models (AuditorConfig, AuditReport, AuditFinding, AuthSessionState)
- [ ] T004 Create `packages/conformance/src/cli.ts` parsing arguments defined in contracts/cli.md
- [ ] T005 [P] Create `packages/conformance/src/reporters/console.ts` for terminal output
- [ ] T006 [P] Create `packages/conformance/src/reporters/json.ts` for JSON output
- [ ] T007 [P] Create `packages/conformance/src/reporters/markdown.ts` for markdown output
- [ ] T008 Create `packages/conformance/tests/reporters.test.ts` to verify formatter outputs

**Checkpoint**: CLI skeleton and formatters are ready.

---

## Phase 3: User Story 1 - Conformance Execution (Priority: P1) 🎯 MVP

**Goal**: Automatically verify compliance with the core authentication flow (Discovery, PAR, PKCE/DPoP, Token Exchange, ID Token, Userinfo).

**Independent Test**: Can be tested by executing the CLI against a mock server and observing the PASS/FAIL reports for standard flow checks.

### Tests for User Story 1

- [ ] T009 [P] [US1] Create unit tests for crypto utilities in `packages/conformance/tests/crypto.test.ts`
- [ ] T010 [P] [US1] Create unit tests for HTTP utilities in `packages/conformance/tests/http.test.ts`
- [ ] T011 [P] [US1] Create unit tests for OIDC checks in `packages/conformance/tests/checks.test.ts`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement `packages/conformance/src/utils/crypto.ts` (JWKS, PKCE challenge/verifier, ES256/RS256 token validation)
- [ ] T013 [P] [US1] Implement `packages/conformance/src/utils/http.ts` (Fetch wrapper, DPoP header generation)
- [ ] T014 [US1] Implement Discovery and JWKS checks in `packages/conformance/src/checks/discovery.ts`
- [ ] T015 [US1] Implement PAR request check in `packages/conformance/src/checks/par.ts`
- [ ] T016 [US1] Implement Token Exchange and ID Token validation check in `packages/conformance/src/checks/token.ts`
- [ ] T017 [US1] Implement Userinfo request check in `packages/conformance/src/checks/userinfo.ts`
- [ ] T018 [US1] Implement core orchestrator `packages/conformance/src/runner.ts` to execute US1 checks sequentially
- [ ] T019 [US1] Integrate `src/runner.ts` execution into `packages/conformance/src/cli.ts`

**Checkpoint**: At this point, the standard happy-path OIDC conformance execution should function correctly.

---

## Phase 4: User Story 2 - Edge Case & Security Testing (Priority: P1)

**Goal**: Simulate malicious inputs and edge cases (replay attacks, invalid tokens, mismatched redirect URIs) to ensure robust rejection.

**Independent Test**: Can be verified by running the CLI tests specifically scoped to security/edge cases against a compliant server and ensuring it correctly expects failures.

### Tests for User Story 2

- [ ] T020 [P] [US2] Create unit tests for security edge cases in `packages/conformance/tests/security.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Implement Replay Attack check in `packages/conformance/src/checks/security/replay.ts`
- [ ] T022 [US2] Implement Invalid PKCE/Token check in `packages/conformance/src/checks/security/invalid_token.ts`
- [ ] T023 [US2] Implement Mismatched Redirect URI check in `packages/conformance/src/checks/security/redirect.ts`
- [ ] T024 [US2] Update `packages/conformance/src/runner.ts` to execute US2 security checks in the testing sequence

**Checkpoint**: Security and negative-path assertions are fully functional.

---

## Phase 5: User Story 3 - Config and Developer Portal Verification (Priority: P2)

**Goal**: Verify the developer portal app configuration and MyInfo scope usage.

**Independent Test**: Provide static app-configuration inputs and ensure the tool parses and flags missing exact-match validations and warns on MyInfo consent UX.

### Tests for User Story 3

- [ ] T025 [P] [US3] Create unit tests for config verification in `packages/conformance/tests/config.test.ts`

### Implementation for User Story 3

- [ ] T026 [US3] Implement config, redirect_uri strictness, and scope validation in `packages/conformance/src/checks/config.ts`
- [ ] T027 [US3] Update `packages/conformance/src/runner.ts` to execute US3 config checks

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T028 [P] Add JSDoc comments to all public utility functions in `packages/conformance/src/`
- [ ] T029 Execute full conformance test against a local mock environment and verify exit codes (0 for PASS, 1 for FAIL, 2 for error)
- [ ] T030 Ensure no secrets (e.g., client secrets, private keys) are leaked into `packages/conformance/src/reporters/` logs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2. Provides the core `runner.ts` and utility files.
- **User Story 2 (P1)**: Can start after User Story 1 (depends on core HTTP/crypto utilities).
- **User Story 3 (P2)**: Can start after Phase 2 independently, but execution depends on `runner.ts` from US1.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- All Foundational tasks marked [P] (reporters, types) can be developed in parallel.
- Utility implementations (`crypto.ts`, `http.ts`) and their respective tests can be written in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Types, CLI, Reporters)
3. Complete Phase 3: User Story 1 (Core OIDC Conformance)
4. **STOP and VALIDATE**: Test User Story 1 independently against a live OIDC server
5. Deploy MVP CLI Tool

### Incremental Delivery

1. Phase 1 + 2
2. US1 -> Verify -> Milestone 1
3. US2 -> Add Edge Case checks -> Verify -> Milestone 2
4. US3 -> Add Config checks -> Verify -> Milestone 3