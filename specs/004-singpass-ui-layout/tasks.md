# Tasks: Singpass UI Base Layout and Login Screen

**Input**: Design documents from `/specs/004-singpass-ui-layout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Included as per NFRs and User Story acceptance scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All paths are relative to the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure in `apps/frontend/src/` per implementation plan
- [X] T002 [P] Initialize Tailwind CSS v4 configuration (design tokens (brand colors, fonts, etc)) in `apps/frontend/tailwind.config.mjs`
- [X] T002b [P] Setup SVG inline icon assets for Singpass logos and placeholders in `apps/frontend/src/assets/icons/`
- [X] T003 [P] Setup i18n store and translation dictionary in `apps/frontend/src/lib/i18n.svelte.ts`
- [X] T004 [P] Implement NRIC/FIN checksum validation logic in `apps/frontend/src/lib/nric-validator.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Define Singpass design tokens and global styles in `apps/frontend/src/assets/styles/global.css`
- [X] T006 Create BaseLayout Astro component in `apps/frontend/src/layouts/BaseLayout.astro`
- [X] T006b Define shared UI TypeScript interfaces (if needed) in `apps/frontend/src/lib/types.ts`
- [X] T007 [P] Create Masthead Astro component in `apps/frontend/src/components/Masthead.astro`
- [X] T008 [P] Create Header Astro component in `apps/frontend/src/components/Header.astro`
- [X] T009 [P] Create Footer Astro component in `apps/frontend/src/components/Footer.astro`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authentic Singpass Visual Experience (Priority: P1) 🎯 MVP

**Goal**: Display header, footer, masthead, and typography consistent with Singpass branding (looks and feels like the official Singpass portal).

**Independent Test**: Visually verify layout components (Masthead, Header, Footer) on the index page against official portal design and compare against official Singpass portal for layout, color, and typography match.

### Implementation for User Story 1

- [X] T010 [P] [US1] Create Singpass Logo SVG component in `apps/frontend/src/components/icons/SingpassLogo.svelte`
- [X] T011 [US1] Implement responsive Header with Logo and navigation placeholders in `apps/frontend/src/components/Header.astro`
- [X] T012 [US1] Implement Footer with official links and copyright in `apps/frontend/src/components/Footer.astro`
- [X] T013 [US1] Assemble BaseLayout in `apps/frontend/src/layouts/BaseLayout.astro` and apply to `apps/frontend/src/pages/index.astro`

**Checkpoint**: At this point, User Story 1 should be fully functional, testable independently and the page layout strongly visually resembles Singpass with correct header and footer, though main content is empty.

---

## Phase 4: User Story 2 - Interactive Login Tab Selection (Priority: P1)

**Goal**: Switch between "Singpass App" and "Password Login" tabs.

**Independent Test**: Click tabs and verify content switching (QR placeholder vs empty form).

### Implementation for User Story 2

- [X] T014 [US2] Create LoginTabs Svelte component in `apps/frontend/src/components/LoginTabs.svelte`
- [X] T015 [P] [US2] Create QRPlaceholder Svelte component with pulsing SVG animation in `apps/frontend/src/components/QRPlaceholder.svelte`
- [X] T016 [US2] Implement tab switching logic in `apps/frontend/src/components/LoginTabs.svelte` (Default: Password Login)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Password Login Form Submission (Priority: P2)

**Goal**: Functional login form with NRIC validation and password toggle.

**Independent Test**: Enter invalid NRIC to see error message; toggle password visibility; click Login for "Demo Mode" alert.

### Implementation for User Story 3

- [ ] T017 [US3] Create LoginForm Svelte component in `apps/frontend/src/components/LoginForm.svelte`
- [ ] T018 [P] [US3] Implement NricInput Svelte component with real-time checksum validation in `apps/frontend/src/components/NricInput.svelte`
- [ ] T019 [P] [US3] Implement PasswordInput Svelte component with show/hide toggle in `apps/frontend/src/components/PasswordInput.svelte`
- [ ] T020 [US3] Integrate validation errors and "Demo Mode" alert in `apps/frontend/src/components/LoginForm.svelte`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: User Story 4 - Multi-language Content Switching (Priority: P2)

**Goal**: Switch UI language between English, Mandarin, Malay, and Tamil.

**Independent Test**: Change language in switcher and verify all UI text updates instantly (< 0.2s).

### Implementation for User Story 4

- [ ] T021 [US4] Create LanguageSwitcher Svelte component in `apps/frontend/src/components/LanguageSwitcher.svelte`
- [ ] T022 [US4] Map all UI strings in components to i18n store keys in `apps/frontend/src/lib/i18n.svelte.ts`
- [ ] T023 [US4] Integrate LanguageSwitcher into Header in `apps/frontend/src/components/Header.astro`

**Checkpoint**: Interface fully localized and switchable across all 4 languages.

---

## Phase 7: Polish & Cross-cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T024 [P] Ensure iOS 12+ compatibility via Tailwind v4 polyfills and CSS fixes in `apps/frontend/src/assets/styles/global.css`
- [ ] T025 [P] Add ARIA labels and roles to all interactive components for WCAG compliance
- [ ] T026 Perform responsive audit and fix mobile layout issues in `apps/frontend/src/assets/styles/global.css`
- [ ] T027 [P] Create smoke tests for layout and basic interactions in `apps/frontend/tests/smoke.test.ts`
- [ ] T028 [P] Create component tests for NRIC validation in `apps/frontend/tests/components/NricValidator.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 → P2 → P3).
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1.
- **User Story 3 (P3)**: Depends on US2 (LoginForm is nested within tabs).
- **User Story 4 (P4)**: Affects all components; best implemented after US1-3 are stable.

### Parallel Opportunities

- T002, T003, T004 can run in parallel.
- T007, T008, T009 can run in parallel.
- US1 and US2 can start in parallel after Phase 2.
- T018 and T019 (Form inputs) can be developed in parallel with T017.
- Polish phase tasks T024, T025, T027, T028 can run in parallel.

---

## Parallel Example: User Story 3

```bash
# Implement form inputs together:
Task: "Implement NricInput Svelte component in apps/frontend/src/components/NricInput.svelte"
Task: "Implement PasswordInput Svelte component in apps/frontend/src/components/PasswordInput.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 & 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Branding)
4. Complete Phase 4: User Story 2 (Tab Interactions)
5. **STOP and VALIDATE**: Verify the interactive shell of the portal.

### Incremental Delivery

1. Foundation ready.
2. Add User Story 1 (Visual Identity).
3. Add User Story 2 (Navigation Context).
4. Add User Story 3 (Functional Login Form).
5. Add User Story 4 (Accessibility & Internationalization).
6. Each story adds value without breaking previous stories.
