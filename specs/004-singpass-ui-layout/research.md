# Research: Singpass UI Base Layout and Login Screen

## Decision 1: NRIC/FIN Checksum Algorithm
- **Decision**: Implement a robust checksum validator for Singapore NRIC/FIN numbers supporting S, T, F, G, and M series.
- **Rationale**: Required for authentic Singpass login experience. The algorithm involves weighted sums and letter mappings.
- **Algorithm Details**:
  - **Weights**: `2, 7, 6, 5, 4, 3, 2` applied to the 7 digits.
  - **Offsets**: `S: 0`, `T: 4`, `F: 0`, `G: 4`, `M: 3`.
  - **Calculation**: `Sum = (Digit1*2 + Digit2*7 + Digit3*6 + Digit4*5 + Digit5*4 + Digit6*3 + Digit7*2) + Offset`.
  - **Remainder**: `Remainder = Sum % 11`.
  - **Letter Mapping (Index = Remainder)**:
    - **S/T**: `J Z I H G F E D C B A`
    - **F/G**: `X W U T R Q P N M L K`
    - **M**: `K L J N P Q R T U W X`
- **Alternatives considered**: 
  - Simple length/prefix check (rejected as too basic per FR-004 requirements).
  - Backend validation (rejected as this is a UI-only prototype phase).

## Decision 2: Singpass Branding Visual Identity
- **Decision**: Use approximated CSS custom properties based on public portal inspection.
- **Rationale**: Direct official design tokens are unavailable. High-fidelity visual matching requires precise HEX codes and clean typography.
- **Design Tokens**:
  - **Singpass Red**: `#E31C3D`
  - **Text Dark**: `#212121`
  - **Background Light**: `#F9F9F9`
  - **Fonts**: System-stack sans-serif (Inter/SF Pro/Segoe UI) to match the portal's clean aesthetic.
- **Alternatives considered**: Standard Tailwind defaults (rejected for not being "exact design system").

## Decision 3: Internationalization (i18n) Strategy
- **Decision**: Use Svelte native stores/runes for light-weight state management of translations.
- **Rationale**: Svelte 5's runes and stores offer high performance for the < 0.2s switch requirement without needing full libraries like `i18next` for a single page.
- **Implementation**:
  - A `locale` rune store in `lib/i18n.svelte.ts`.
  - Translation dictionary mapped by `(key, locale)`.
- **Alternatives considered**: `i18next` with `svelte-i18n` (rejected as potentially more overhead for a small prototype).

## Decision 4: Legacy Browser Support (iOS 12+)
- **Decision**: Use Tailwind CSS v4 with appropriate polyfills for Flexbox/Grid.
- **Rationale**: Tailwind v4 uses modern CSS features but requires ensuring browser compatibility for older WebKit versions in iOS 12.
- **Alternatives considered**: Standard CSS without Tailwind (rejected for slower development speed).

## Decision 5: Astro SSG + Svelte Islands
- **Decision**: Use Astro for the static layout (header/footer) and Svelte for the interactive login card (tabs, form, i18n).
- **Rationale**: Aligns with the monorepo architecture and provides the best performance/DX balance.
- **Alternatives considered**: Pure Svelte SPA (rejected by project tech stack mandates).
