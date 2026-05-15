# CI Failure Fix Flows

## Mapping Job Names to Nx Targets

The CI workflow (`.github/workflows/ci.yml`) runs these jobs:

| Job name           | Nx target(s) to run locally                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint, Test & Build | `nx format:check`, `nx affected --target=lint`, `nx affected --target=typecheck`, `nx affected --target=test`, `nx affected --target=build` |
| Integration Tests  | `nx affected --target=integration-test` (requires DB)                                                                                       |

When a job fails, run **only the failing step**, not the full job. Read the job's `html_url` to identify which step failed if the job name alone is ambiguous.

## Local Reproduce and Fix Flow

1. **Identify the failing target** from the job name and CI logs (visit `html_url`)
2. **Reproduce locally**:
   ```bash
   npm exec -- nx affected --target=<target> --base=main
   ```
3. **Fix** the code. For formatting errors: `npm exec -- nx format` then re-check.
4. **Verify** locally — the target must pass before pushing:
   ```bash
   npm exec -- nx affected --target=<target> --base=main
   ```
5. **Commit** (stage specific files by name) and **push**

## Commit Message Format

```
fix(<scope>): <brief description>

Failed CI: <job name>
Local verification: passed
```

## Environment vs Code Failures

Do not attempt a local fix for environment/tooling failures. Signs:

- `command not found` / binary missing
- Out of memory / heap allocation failure
- Network timeout / DNS failure
- Permission denied
- Docker/container issues

For these, report to the user and exit — they require infrastructure investigation, not code changes.

## Integration Test Failures

Integration tests require a running database. Before reproducing locally:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Then run migrations if needed:

```bash
npm exec nx run api:db:migrate
```

## Git Safety

- Stage specific files by name — never `git add -A` or `git add .`
- If the fix touches unrelated files the user is working on, stage only the fix files
