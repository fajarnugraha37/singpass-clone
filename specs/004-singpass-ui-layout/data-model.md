# Data Model: Singpass UI Base Layout and Login Screen

This document defines the client-side state and logical entities for the Singpass UI prototype.

## Client-Side State

### `LoginState`
- **currentTab**: `"app"` | `"password"` (Default: `"password"`)
- **language**: `"en"` | `"zh"` | `"ms"` | `"ta"` (Default: `"en"`)

### `CredentialForm`
- **singpassId**: `string` (Validated via NRIC/FIN checksum)
- **password**: `string`
- **showPassword**: `boolean` (Default: `false`)

## Entities (Client-side logic)

### `NRICValidator`
- **Input**: `string`
- **Method**: `isValid()`
- **Logic**: S/T/F/G/M series checksum algorithm (see `research.md`).

### `I18nProfile`
- **Keys**:
  - `login.header`
  - `login.tab.app`
  - `login.tab.password`
  - `login.form.id.label`
  - `login.form.password.label`
  - `login.form.submit`
  - `login.footer.links`

## UI Component Hierarchy

- **BaseLayout (Astro)**
  - **Header (Astro)**
    - **LanguageSwitcher (Svelte Island)**
  - **LoginCard (Svelte Island)**
    - **TabSwitcher (Svelte)**
    - **SingpassAppTab (Svelte)**
      - **QRPlaceholder (SVG)**
    - **PasswordLoginTab (Svelte)**
      - **NricInput (Svelte)**
      - **PasswordInput (Svelte)**
  - **Footer (Astro)**
