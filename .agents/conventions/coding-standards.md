# Coding Standards

## Testing

### Which test type to write

| What you're building | Test type |
|---|---|
| React component rendering or interaction | Unit — Vitest + Testing Library |
| Pure function or utility | Unit — Vitest (web) or Jest (api) |
| Express route with real DB | Integration — Jest + Supertest |
| Service with DB queries | Integration |
| Full user flow in the browser | E2E — Playwright |

When in doubt, prefer a unit test. Only reach for integration or E2E when the behaviour you're testing genuinely depends on the boundary (HTTP, database, browser).

### File naming and location

- Unit tests: colocated with source, same filename with `.spec.ts(x)` suffix
  - `pokemon.service.ts` → `pokemon.service.spec.ts`
- Integration tests: colocated, `.integration.spec.ts` suffix
  - `game.router.ts` → `game.router.integration.spec.ts`
- E2E tests: `apps/web-e2e/src/*.spec.ts`

### Running tests

```bash
npm exec nx test web                  # frontend unit (Vitest)
npm exec nx test api                  # backend unit (Jest)
npm exec nx integration-test api      # backend integration — requires DB
npm exec nx e2e web-e2e               # E2E — requires full stack running
npm exec nx affected -t test          # only projects affected by current changes
```

Integration tests require the database to be running:
```bash
docker compose -f docker/docker-compose.yml up -d
```

### What makes a good test

- Test behaviour, not implementation — if you can refactor internals without changing tests, the tests are well-written
- One clear assertion per test (or a tight group of related assertions)
- Descriptive test names: `it('returns 404 when pokemon does not exist')` not `it('works')`
- Frontend: query by accessible role or label, never by className or test ID unless unavoidable
- Integration: each test suite is responsible for cleaning up the data it creates

### What not to test

- Framework or library internals (e.g. that Express calls `next()`)
- Type correctness — TypeScript handles that at compile time
- Trivial getters/setters with no logic

---

## Functions

- Prefer arrow functions over `function` declarations
  ```ts
  // prefer
  const add = (a: number, b: number) => a + b;

  // avoid
  function add(a: number, b: number) { return a + b; }
  ```
