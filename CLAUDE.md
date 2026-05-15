<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Guess the Last Pokemon — Project Context

> For full context (domain rules, architecture, conventions), see `.agents/`.

## Feature Implementation Checklist

When implementing any feature or fix, complete every step in order. Do not skip steps or report the task as complete until all are done.

### 1. Write tests

- Unit tests for any new functions, services, or components
- Integration tests for any new API routes (requires DB)
- E2E tests for new user-facing flows (when applicable)
- See `.agents/conventions/coding-standards.md` for which test type to write

### 2. Follow coding standards

- Use arrow functions — never `function` declarations
- See `.agents/conventions/coding-standards.md` for the full list

### 3. Make tests pass

```bash
npm exec nx test api          # backend unit tests
npm exec nx test web          # frontend unit tests
npm exec nx integration-test api  # integration tests (requires DB)
```

Do not proceed if tests are failing.

### 4. Format and lint

```bash
npm exec -- nx format:check
npm exec -- nx affected --target=lint --base=main
```

Fix all failures before committing.

### 5. Commit and push

### 6. Invoke monitor-ci

After every `git push`, invoke the `monitor-ci` skill:

```
/monitor-ci
```

Do not report the task as complete until CI passes.

### 7. Write the spec doc

Create or update `.agents/specs/<feature-name>.md` covering:

- **What it does**: plain-English description
- **Scope**: files/modules involved
- **API contract**: any endpoints added or changed
- **Edge cases**: known constraints or special handling

See `.agents/conventions/feature-workflow.md` for the full format.

## Monorepo Layout

```
apps/web/       React frontend  — Vite build, Vitest unit tests, Playwright E2E
apps/web-e2e/   Playwright E2E tests for web
apps/api/       Express backend — Jest unit + integration tests
libs/shared-types/  Shared TypeScript interfaces (imported as @guess-the-last/shared-types)
docker/         docker-compose.yml for Postgres
agents/         AI-native context: architecture, domain, conventions, prompt templates
```

## Key Commands

```bash
# Start the database (required for integration tests and local dev)
docker compose -f docker/docker-compose.yml up -d

# Run frontend dev server
npm exec nx serve web

# Run backend dev server
npm exec nx serve api

# Unit tests
npm exec nx test web          # Vitest
npm exec nx test api          # Jest

# Integration tests (requires DB)
npm exec nx integration-test api

# E2E tests
npm exec nx e2e web-e2e

# Run all affected tests
npm exec nx affected -t test
```

## Node Version

This project requires Node 22+. Use `nvm use 22` before running any commands.

## Environment Setup

Copy `.env.example` to `.env` and start Docker before running the API locally.

After cloning, configure git to use the project's hooks directory (one-time):

```bash
git config core.hooksPath .githooks
```

## Import Alias

`@guess-the-last/shared-types` resolves to `libs/shared-types/src/index.ts` (via `tsconfig.base.json` paths).

## Testing Strategy

- **Unit tests** (`*.spec.ts/tsx`): colocated with source, no external dependencies
- **Integration tests** (`*.integration.spec.ts`): in `apps/api`, require a live Postgres DB
- **E2E tests** (`apps/web-e2e/`): full browser tests via Playwright
