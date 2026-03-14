# Tasks for: Serve Static Frontend Assets

**Branch**: `010-serve-static-assets`

This task list is generated from the feature specification and implementation plan.

## Phase 1: Setup

- [x] T001 Create the middleware file `apps/backend/src/middleware/static.ts`.

## Phase 2: User Story 1 - Access Frontend Application

**Goal**: As an end-user, I want to access the web application by navigating to the backend's URL.
**Independent Test**: The backend can be deployed, and a user can access the frontend application through a browser.

- [x] T002 [US1] Implement the basic static serving logic in `apps/backend/src/middleware/static.ts` to serve files from `apps/frontend/dist`.
- [x] T003 [US1] Integrate the new static middleware into the main Hono application in `apps/backend/src/index.ts`.
- [x] T004 [P] [US1] Implement ETag generation and handling in `apps/backend/src/middleware/static.ts` for caching.
- [x] T005 [P] [US1] Implement request logging for all asset requests in `apps/backend/src/middleware/static.ts`.
- [x] T006 [P] [US1] Implement security checks to prevent directory traversal attacks in `apps/backend/src/middleware/static.ts`.

## Phase 3: User Story 2 - Client-Side Routing

**Goal**: As an end-user, I want to navigate to a client-side route directly or refresh the page on a client-side route.
**Independent Test**: A user can directly enter a URL for a client-side route and the application will load correctly.

- [x] T007 [US2] Modify the static serving middleware in `apps/backend/src/middleware/static.ts` to serve `index.html` for any path that does not match a static file, to support client-side routing.

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T008 [P] Add unit tests for the static middleware in a new file `apps/backend/tests/middleware/static.test.ts`.
- [x] T009 Update the main `README.md` with a section on how the frontend assets are served by the backend.

## Dependencies

- User Story 2 ([US2]) depends on the completion of User Story 1 ([US1]).

## Parallel Execution

- Within User Story 1, tasks T004, T005, and T006 can be worked on in parallel after T002 is complete.
- The testing task T008 can be started in parallel with the implementation tasks.

## Implementation Strategy

The implementation will follow the phases outlined above. The MVP (Minimum Viable Product) will be the completion of Phase 2 (User Story 1), which will enable basic serving of the frontend application.
