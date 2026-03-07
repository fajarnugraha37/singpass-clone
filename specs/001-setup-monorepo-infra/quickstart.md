# Quickstart: Setup Monorepo Infrastructure

**Feature**: 001-setup-monorepo-infra
**Status**: Draft

## Developer Guide

Follow these steps to initialize and work in the `vibe-auth` monorepo environment.

### 1. Prerequisites
- **Runtime**: Bun 1.1+ (Windows/macOS/Linux).
- **Tooling**: VS Code with Astro and Svelte extensions.

### 2. Initialization
From the repository root, run:
```bash
bun install
```
This will install all dependencies for both the frontend and backend using a single root `bun.lock` file.

### 3. Local Development
To start both the frontend and backend dev servers concurrently:
```bash
bun run dev
```
- **Backend (Hono)**: Defaults to `http://localhost:3000/api`
- **Frontend (Astro)**: Defaults to `http://localhost:4321/`

### 4. Running Tests
Run unit and integration tests across all workspaces:
```bash
bun test
```
To check code coverage:
```bash
bun test --coverage
```
*Note: The target is 80% or greater code coverage for all new features.*

### 5. Formatting & Linting
Ensure code style consistency before committing:
```bash
bun run format  # Fixes code with Prettier
bun run lint    # Checks for linting errors with ESLint
```
