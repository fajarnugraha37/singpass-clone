# Feature Specification: Singpass UI Base Layout and Login Screen

**Feature Branch**: `004-singpass-ui-layout`  
**Created**: 2026-03-08  
**Status**: Draft  
**Input**: User description: "Implement the Singpass UI Base Layout and Login Screen. Goal: Build the frontend UI matching the Singpass visual identity using Astro and Svelte. Requirements: 1. Use Astro SSG, Tailwind CSS, and Svelte islands. 2. Create a base layout simulating the Singpass visual identity (header, footer, typography). 3. Implement the main login interface featuring the 'Singpass App' (QR code placeholder) tab and the 'Password Login' tab. 4. The Password Login tab must include a form for Singpass ID (NRIC/FIN) and Password. 5. All UI must be accessible and responsive. No backend integration yet, just the exact design system and interactive Svelte tabs."

## Clarifications

### Session 2026-03-08

- Q: Which login method should be active by default when the page first loads? → A: **Password Login**
- Q: How strictly should the Singpass ID (NRIC/FIN) field be validated in this initial UI-only phase? → A: **Full Checksum Validation** (includes the formal NRIC/FIN algorithm check)
- Q: Should the password field include a "show/hide" toggle for better usability? → A: **Yes** (Include a toggle to show/hide the password)
- Q: Should this initial UI implement a language switcher to match the official portal's internationalization? → A: **Full i18n** (English, Mandarin, Malay, Tamil functional)
- Q: What is the minimum browser support target for this UI prototype? → A: **Extended Support** (Including iOS 12+ and older Chrome versions)
- Q: How should validation errors (like an invalid NRIC checksum) be displayed to the user? → A: **Option A** (Inline red text directly below the invalid input field)
- Q: What should happen when the user clicks the "Log In" button on the Password Login tab? → A: **Option A** (Display an alert or inline message stating "Demo Mode: No backend connected")
- Q: How should the "Singpass App" QR code placeholder be visually represented? → A: **Option A** (A static SVG QR code with a pulsing "waiting" animation)
- Q: What is the strategy for handling images (like logos) in this offline-only prototype? → A: **Option A** (Embed all icons and logos as inline SVGs)
- Q: What level of detail should be provided in Singpass ID validation error messages? → A: **Specific Messages** (Differentiate between "Required", "Invalid Format", and "Checksum Failed")
- Q: Should the "Log In" button be disabled until the form is valid, or remain clickable? → A: **Hybrid** (Clickable, but shows a tooltip/toast if form is invalid)
- Q: Should the Singpass ID remain visible as the user types, or be masked? → A: **Visible** (The ID remains fully visible for verification)
- Q: Should this UI prototype include a "Remember Singpass ID" checkbox? → A: **Yes** (Include for visual fidelity and simulate state management)
- Q: Should this prototype include a "Singapore Government Agency Website" masthead? → A: **Yes** (Include the full masthead with lion head logo and expandable section)


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authentic Singpass Visual Experience (Priority: P1)

As a user, I want to see a website that looks and feels like the official Singpass portal so that I feel secure and familiar with the environment.

**Why this priority**: Essential for establishing the correct design system and branding before adding functionality.

**Independent Test**: The UI can be visually compared against the official Singpass portal for layout, color scheme, and typography consistency.

**Acceptance Scenarios**:

1. **Given** the user navigates to the portal, **When** the page loads, **Then** the header with the Singpass logo and the footer are displayed correctly.
2. **Given** a high-resolution display, **When** the user views the typography, **Then** it matches the clean, professional style of the official Singpass brand.

---

### User Story 2 - Interactive Login Tab Selection (Priority: P1)

As a user, I want to switch between different login methods (Singpass App and Password Login) so that I can choose my preferred way to authenticate.

**Why this priority**: Core interaction for the login screen.

**Independent Test**: Can be tested by clicking on tabs and verifying that the correct content is shown for each method.

**Acceptance Scenarios**:

1. **Given** the user is on the login page, **When** they click the "Singpass App" tab, **Then** a static SVG QR code with a pulsing "waiting" animation is displayed.
2. **Given** the "Singpass App" tab is active, **When** the user clicks the "Password Login" tab, **Then** the login form for Singpass ID and Password appears.

---

### User Story 3 - Password Login Form Submission (Priority: P2)

As a user, I want to enter my credentials in a clear and accessible form so that I can eventually log into the system.

**Why this priority**: Necessary for the manual login flow.

**Independent Test**: The form fields can be filled, and the submit button can be clicked, even though no backend processing occurs yet.

**Acceptance Scenarios**:

1. **Given** the "Password Login" tab is active, **When** the user enters a Singpass ID and Password, **Then** the fields accept input according to expected formats (e.g., NRIC/FIN structure).
2. **Given** the user is using a screen reader, **When** they navigate the login form, **Then** all fields and buttons are properly labeled and accessible.
3. **Given** an invalid Singpass ID is entered, **When** the field loses focus or the form is submitted, **Then** a clear red error message appears directly below the field.
4. **Given** valid credentials are entered, **When** the "Log In" button is clicked, **Then** a "Demo Mode" alert or message is displayed to confirm the interaction.

---

### User Story 4 - Multi-language Content Switching (Priority: P2)

As a multi-lingual user, I want to switch the interface language between English, Mandarin, Malay, and Tamil so that I can use the portal in my preferred language.

**Why this priority**: Matches the official Singpass portal's commitment to inclusivity.

**Independent Test**: Can be tested by selecting different languages from the language switcher and verifying that all UI text updates accordingly.

**Acceptance Scenarios**:

1. **Given** the user is on the login page, **When** they select "Mandarin" from the language switcher, **Then** all labels, tabs, and buttons are translated into Mandarin.
2. **Given** a non-English language is selected, **When** the user switches back to "English", **Then** the interface reverts to English instantly.

---

### Edge Cases

- **Mobile Responsiveness**: How does the layout handle small screens, especially the tabbed interface?
- **Invalid Form Input**: Validation errors are displayed as inline red text below the input field.
- **Slow Assets**: How does the UI look if the Singpass logo or QR code placeholder fails to load?
- **Character Encoding**: Ensure that Mandarin, Malay (with specific characters), and Tamil characters are rendered correctly across all browsers.
- **Legacy Polyfills**: Ensure that Svelte/Astro features degrade gracefully or are polyfilled for iOS 12/older Chrome.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a base layout featuring a header, main content area, and footer consistent with Singpass branding.
- **FR-002**: System MUST implement a tabbed interface for switching between "Singpass App" and "Password Login" methods, with **Password Login** active by default.
- **FR-003**: The "Singpass App" tab MUST display a visual placeholder for a QR code (static SVG with a pulsing animation).
- **FR-004**: The "Password Login" tab MUST contain a form with fields for Singpass ID (NRIC/FIN) and Password, including **full checksum validation** for the NRIC/FIN format.
- **FR-005**: All UI components MUST be responsive and adapt to different screen sizes (mobile, tablet, desktop).
- **FR-006**: The interface MUST be accessible, following WCAG standards for labeling and keyboard navigation.
- **FR-007**: System MUST use high-quality visual approximation of the official Singpass color palette and typography (e.g., standard red/black/white palette and clean sans-serif fonts) to ensure brand consistency.
- **FR-012**: System MUST embed all branding icons and logos as inline SVGs for maximum reliability.
- **FR-008**: The password field MUST include a "show/hide" toggle to improve usability and reduce user error.
- **FR-009**: System MUST support full multi-language switching between English, Mandarin (简体中文), Bahasa Melayu, and Tamil (தமிழ்).
- **FR-010**: System MUST display validation errors as inline red text directly below the invalid input field.
- **FR-011**: System MUST display a "Demo Mode: No backend connected" message or alert when the "Log In" button is clicked with valid inputs.

### Non-Functional Requirements

- **NFR-001**: System MUST support **Extended Browser Support** target, including iOS 12+ and older Chrome versions.
- **NFR-002**: Page load time for initial render MUST be under 1.5 seconds on a 3G connection.

### Key Entities *(include if feature involves data)*

- **Login Session**: Represents the state of the user's interaction with the login tabs (selected tab, form input).
- **Credential Form**: Data structure capturing the Singpass ID and Password inputs.
- **Localization Profile**: Configuration containing translations for all 4 supported languages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between login tabs in under 0.5 seconds (visual transition).
- **SC-002**: The login form and tabs are 100% functional on mobile, tablet, and desktop devices, including verified iOS 12+ compatibility.
- **SC-003**: Lighthouse accessibility score for the login page is 95 or higher.
- **SC-004**: 100% of the specified visual elements (header, footer, tabs) match the official Singpass layout as per the requirements.
- **SC-005**: Language switching occurs instantly (< 0.2s) without a full page reload (using Svelte state).
