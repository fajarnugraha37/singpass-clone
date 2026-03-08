# Implementation Plan: Singpass UI Base Layout and Login Screen

**Branch**: `004-singpass-ui-layout` | **Date**: 2026-03-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-singpass-ui-layout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement the Singpass visual identity and main login interface using Astro, Svelte, and Tailwind CSS. The focus is on a high-fidelity, accessible, and responsive frontend that supports both QR-based (Singpass App) and manual (Password) login flows, including full i18n support and NRIC/FIN validation.

## Technical Context

**Language/Version**: TypeScript 5.x / Bun 1.1+
**Primary Dependencies**: Astro, Svelte, TailwindCSS
**Storage**: N/A (UI-only prototype)
**Testing**: Bun test (Smoke tests and Svelte component tests)
**Target Platform**: Web (Astro SSG), Responsive Mobile/Desktop, iOS 12+ support
**Project Type**: Frontend Web Application (Astro with Svelte islands)
**Performance Goals**: <1.5s initial render (3G), <0.5s tab switch, <0.2s lang switch
**Constraints**: Extended browser support (iOS 12+), 4 languages (EN, ZH, MS, TA), Full NRIC/FIN checksum validation
**Scale/Scope**: Base layout (Header/Footer), Login Screen (2 tabs), i18n Localization Profile

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Architecture Check**: Follows Hexagonal Architecture (UI as an adapter), DRY, KISS. Consistent coding conventions. Separates Hono backend from Astro frontend.
- [x] **API Stability Check**: N/A (UI-only for now, but will follow Singpass contracts in future phases).
- [x] **Security Check**: No backend yet, but UI-side validation (NRIC checksum) and secure password field implementation (show/hide toggle) are prioritized.
- [x] **Protocol Check**: Simulates Singpass login flows (QR and Password fallback).
- [x] **Testing Check**: Planned smoke tests for layout and component tests for login logic.
- [x] **AI Boundaries Check**: Deterministic execution. Will utilize local `docs/` for Singpass identity and logic.
- [x] **Documentation Check**: Spec-driven. Plan and research documented before implementation.

## Project Structure

### Documentation (this feature)

```text
specs/004-singpass-ui-layout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── assets/          # Global styles, fonts, images
│   ├── components/      # Svelte components (LoginTabs, NricInput, LangSwitcher, etc.)
│   ├── layouts/         # Astro BaseLayout (Header, Footer)
│   ├── pages/           # index.astro (Login page)
│   └── lib/             # Utilities (NRIC validation, i18n logic)
└── tests/
    ├── smoke.test.ts    # Layout and navigation tests
    └── components/      # Svelte component logic tests
```

**Structure Decision**: Option 2 (Web application) adapted for the existing `apps/frontend` directory. Logic isolated in `lib/` and UI in `components/` and `layouts/`.

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations detected. | N/A |
