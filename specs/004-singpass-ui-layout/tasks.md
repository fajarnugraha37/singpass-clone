---
description: "Task list for implementing Singpass UI Base Layout and Login Screen"
---

# Tasks: Singpass UI Base Layout and Login Screen

**Input**: Design documents from `/specs/004-singpass-ui-layout/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and design tokens.

- [ ] T001 Initialize Tailwind CSS design tokens (brand colors, fonts) in `apps/frontend/src/assets/styles/global.css` or Tailwind config
- [ ] T002 [P] Setup SVG inline icon assets for Singpass logos and placeholders in `apps/frontend/src/assets/icons/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI structure needed before implementing user stories.

- [ ] T003 Create `BaseLayout` Astro component skeleton in `apps/frontend/src/layouts/BaseLayout.astro`
- [ ] T004 Define shared UI TypeScript interfaces (if needed) in `apps/frontend/src/lib/types.ts`

**Checkpoint**: Base layout structure is established and ready for integration.

---

## Phase 3: User Story 1 - Authentic Singpass Visual Experience (Priority: P1) 🎯 MVP

**Goal**: Deliver a website that looks and feels like the official Singpass portal.

**Independent Test**: Visually compare against official Singpass portal for layout, color, and typography match.

### Tests for User Story 1

- [ ] T005 [P] [US1] Create basic layout and navigation smoke tests in `apps/frontend/tests/smoke.test.ts`

### Implementation for User Story 1

- [ ] T006 [P] [US1] Implement Singpass Header UI with logo and masthead in `apps/frontend/src/layouts/BaseLayout.astro`
- [ ] T007 [P] [US1] Implement Singpass Footer UI with links in `apps/frontend/src/layouts/BaseLayout.astro`
- [ ] T008 [US1] Update `apps/frontend/src/pages/index.astro` to use the completed `BaseLayout.astro`

**Checkpoint**: At this point, the page layout strongly visually resembles Singpass with correct header and footer, though main content is empty.

---

## Phase 4: User Story 2 - Interactive Login Tab Selection (Priority: P1)

**Goal**: Switch between login methods (Singpass App and Password Login) seamlessly.

**Independent Test**: Clicking on tabs switches the displayed content between the QR code view and the password form placeholder.

### Tests for User Story 2

- [ ] T009 [P] [US2] Create component test for tab switching logic in `apps/frontend/tests/components/LoginCard.test.ts`

### Implementation for User Story 2

- [ ] T010 [P] [US2] Create `TabSwitcher.svelte` component in `apps/frontend/src/components/TabSwitcher.svelte`
- [ ] T011 [P] [US2] Create `SingpassAppTab.svelte` with SVG QR placeholder in `apps/frontend/src/components/SingpassAppTab.svelte`
- [ ] T012 [P] [US2] Create `PasswordLoginTab.svelte` layout skeleton in `apps/frontend/src/components/PasswordLoginTab.svelte`
- [ ] T013 [US2] Create Svelte island `LoginCard.svelte` integrating the tab switcher and tab contents in `apps/frontend/src/components/LoginCard.svelte`
- [ ] T014 [US2] Embed `LoginCard` component into `apps/frontend/src/pages/index.astro` main content area

**Checkpoint**: At this point, User Story 2 is functional. Users can load the page and click between the two login tabs.

---

## Phase 5: User Story 3 - Password Login Form Submission (Priority: P2)

**Goal**: Enter credentials in a clear and accessible form with NRIC checksum validation.

**Independent Test**: Form fields accept input, validations trigger inline error messages on invalid input, and submit button shows "Demo Mode" alert on valid input.

### Tests for User Story 3

- [ ] T015 [P] [US3] Create unit tests for NRIC validation algorithm in `apps/frontend/tests/nric.test.ts`
- [ ] T016 [P] [US3] Create component tests for form validation and password toggle in `apps/frontend/tests/components/PasswordLoginTab.test.ts`

### Implementation for User Story 3

- [ ] T017 [P] [US3] Implement NRIC validator logic in `apps/frontend/src/lib/nric.ts`
- [ ] T018 [P] [US3] Create `NricInput.svelte` with inline error and checksum validation in `apps/frontend/src/components/NricInput.svelte`
- [ ] T019 [P] [US3] Create `PasswordInput.svelte` with show/hide toggle in `apps/frontend/src/components/PasswordInput.svelte`
- [ ] T020 [US3] Integrate `NricInput` and `PasswordInput` into `apps/frontend/src/components/PasswordLoginTab.svelte`
- [ ] T021 [US3] Implement "Log In" button logic (demo mode alert, valid state tracking) in `apps/frontend/src/components/PasswordLoginTab.svelte`

**Checkpoint**: The Password Login flow is fully interactive, accessible, and correctly validates the Singpass ID formats.

---

## Phase 6: User Story 4 - Multi-language Content Switching (Priority: P2)

**Goal**: Switch interface language between English, Mandarin, Malay, and Tamil instantly.

**Independent Test**: Select different languages from the LangSwitcher and verify that all UI labels, tabs, and buttons update immediately without reloading.

### Tests for User Story 4

- [ ] T022 [P] [US4] Create component tests for i18n logic and language switching in `apps/frontend/tests/components/LangSwitcher.test.ts`

### Implementation for User Story 4

- [ ] T023 [P] [US4] Implement i18n state management using Svelte runes and translation dictionaries in `apps/frontend/src/lib/i18n.svelte.ts`
- [ ] T024 [P] [US4] Create Svelte island `LangSwitcher.svelte` in `apps/frontend/src/components/LangSwitcher.svelte`
- [ ] T025 [US4] Integrate `LangSwitcher.svelte` into `BaseLayout.astro` header
- [ ] T026 [US4] Update `LoginCard`, `TabSwitcher`, `SingpassAppTab`, and `PasswordLoginTab` components to consume dynamic i18n store values

**Checkpoint**: The entire page supports localization, and changing languages updates UI text seamlessly.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final UI validation, accessibility checks, and mobile responsiveness.

- [ ] T027 Run accessibility (WCAG) audits for ARIA roles, input labels, and keyboard navigation across all Svelte components
- [ ] T028 Validate mobile responsiveness across devices using Tailwind UI breakpoints
- [ ] T029 Test iOS 12+ legacy layout compatibility (e.g., verifying flexbox/grid behaviors)
- [ ] T030 Execute full smoke test and component test suite (`bun test`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Foundational**: No dependencies, must be completed first.
- **User Stories (Phase 3-6)**:
  - US1 (Layout) and US2 (Tabs) can be implemented in sequence.
  - US3 (Form) depends on US2 being completed to have a place for the form.
  - US4 (Multi-language) depends on US1, US2, and US3 being completed so all text is ready for translation.
- **Polish**: Depends on all stories being completed.

### Parallel Opportunities

- **Phase 1**: Tailwind styling (T001) and asset preparation (T002) can run in parallel.
- **Phase 3**: Tests (T005), Header (T006), and Footer (T007) can run in parallel.
- **Phase 4**: Tab components (T010, T011, T012) can be built in parallel.
- **Phase 5**: NRIC validation logic (T017), NricInput (T018), and PasswordInput (T019) can be developed in parallel.
- **Phase 6**: i18n core logic (T023) and LangSwitcher UI (T024) can be developed in parallel.

### Implementation Strategy

1. **Setup & Foundation**: Get styling and Astro layout skeleton ready.
2. **MVP Delivery**: Complete US1 and US2 to provide the visual shell and basic interactivity (switching tabs).
3. **Core Functionality**: Complete US3 to provide the required NRIC login form and interaction validation.
4. **Localization**: Complete US4 to make the components translatable.
5. **Final QA**: Validate NFRs like browser support (iOS 12+) and accessibility.
