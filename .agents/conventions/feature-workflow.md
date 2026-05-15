# Feature Implementation Workflow

Every time an agent implements a feature, it must complete all three steps below before considering the work done.

## 1. Add Tests

Write tests appropriate to what was built. Refer to the testing strategy in `coding-standards.md`:

- Unit tests for any new functions, services, or components
- Integration tests for any new API routes
- E2E tests for new user-facing flows (when applicable)

## 2. Make Sure the Tests Pass

Run the relevant test targets and confirm they are green before finishing:

```bash
npm exec nx test web          # frontend unit tests
npm exec nx test api          # backend unit tests
npm exec nx integration-test api  # backend integration tests (requires DB)
```

Do not leave failing tests. If a pre-existing test breaks due to the change, fix it.

## 3. Lint

Run format check and lint on affected projects and fix all failures before committing:

```bash
npm exec -- nx format:check
npm exec -- nx affected --target=lint --base=main
```

## 4. Document the Feature

Create or update a spec file in `.agents/specs/`. Each feature gets its own file named after the feature (e.g. `.agents/specs/pokemon-search.md`).

A spec file should cover:

- **What it does**: a plain-English description of the feature
- **Scope**: which files/modules are involved
- **API contract**: any endpoints added or changed (method, path, request/response shape)
- **Edge cases**: known constraints or special handling
