---
name: monitor-ci
description: Monitor GitHub Actions CI and handle failures. USE WHEN user says "monitor ci", "watch ci", "ci monitor", "watch ci for this branch", "track ci", "check ci status", wants to track CI status, or needs help with CI failures. Prefer this skill over running gh CLI with --watch flags.
---

# Monitor CI Skill

You are the orchestrator for monitoring GitHub Actions CI checks on a pull request and handling failures. You spawn subagents to fetch CI status, run deterministic decision scripts, and take fix action when needed.

## Context

- **Current Branch:** !`git branch --show-current`
- **Current Commit:** !`git rev-parse --short HEAD`
- **Remote URL:** !`git remote get-url origin`

## User Instructions

$ARGUMENTS

**Important:** If user provides specific instructions, respect them over default behaviors described below.

## Configuration Defaults

| Setting              | Default       | Description                            |
| -------------------- | ------------- | -------------------------------------- |
| `--max-fix-attempts` | 3             | Max local fix cycles before giving up  |
| `--timeout`          | 120           | Max monitoring duration in minutes     |
| `--verbosity`        | medium        | Output level: minimal, medium, verbose |
| `--pr`               | (auto-detect) | PR number to monitor                   |
| `--fresh`            | false         | Ignore previous context, start fresh   |

Parse any overrides from `$ARGUMENTS` and merge with defaults.

## Step 0: Resolve Owner, Repo, and PR Number

### 0a. Parse owner/repo from remote URL

Extract `owner` and `repo` from the remote URL. Examples:

- `git@github.com:owner/repo.git` → owner=`owner`, repo=`repo`
- `https://github.com/owner/repo.git` → owner=`owner`, repo=`repo`

### 0b. Find the PR

If `--pr` was not provided, find the open PR for the current branch:

- Spawn a haiku subagent to call `mcp__github__list_pull_requests` with `owner`, `repo`, `head: "<owner>:<branch>"`, `state: "open"`
- If no open PR found: exit with:
  ```
  No open PR found for branch `<branch>`. Push and create a PR first.
  ```
- Record `pr_number` from the result.

## Architecture

1. **This skill (orchestrator)**: spawns subagents, runs scripts, prints status, does local fix work
2. **status-subagent (haiku)**: calls `mcp__github__pull_request_read` with `get_check_runs`, returns result, exits
3. **ci-poll-decide.mjs (deterministic script)**: takes check_runs JSON + state, outputs a single JSON line

## Status Reporting

Prepend `[monitor-ci]` to every message printed to the user.

## Anti-Patterns

| Anti-Pattern                               | Why It's Bad                                    |
| ------------------------------------------ | ----------------------------------------------- |
| Using `gh pr checks --watch`               | Bypasses this skill's fix workflow, no auto-fix |
| Writing custom polling scripts             | Unreliable, pollutes context                    |
| Running CI checks inline on the main agent | Wastes main agent context tokens                |
| Independently fixing while also polling    | Races with yourself, causes confused state      |

## Main Loop

### Step 1: Initialize

```
poll_count = 0
no_progress_count = 0
fix_attempt_count = 0
prev_conclusions = null
```

### Step 2: Polling Loop

#### 2a. Spawn status-subagent (FETCH_STATUS)

Spawn a haiku subagent to call:

```
mcp__github__pull_request_read(
  method: "get_check_runs",
  owner: <owner>,
  repo: <repo>,
  pullNumber: <pr_number>
)
```

Wait for the result before proceeding.

#### 2b. Run decision script

```bash
node <skill_dir>/scripts/ci-poll-decide.mjs '<check_runs_result_json>' <poll_count> <verbosity> \
  [--no-progress-count <no_progress_count>] \
  [--prev-conclusions '<prev_conclusions_json>'] \
  [--timeout <timeout_seconds>]
```

The script outputs a single JSON line: `{ action, code, message, delay?, noProgressCount, failedJobs? }`

#### 2c. Process script output

Update state:

- `no_progress_count = output.noProgressCount`
- `prev_conclusions` = current check run conclusions (serialize the name→status:conclusion map)
- `poll_count++`

Based on `action`:

- **`poll`**: print `[monitor-ci] <message>`, sleep `output.delay` seconds, go to 2a
- **`done`**: proceed to Step 3 with `output.code`

### Step 3: Handle Result

| Code              | Default Action                  |
| ----------------- | ------------------------------- |
| `ci_success`      | Print success message, exit     |
| `ci_cancelled`    | Print cancelled message, exit   |
| `polling_timeout` | Print timeout message, exit     |
| `circuit_breaker` | Print no-progress message, exit |
| `error`           | Print error, exit               |
| `ci_failure`      | Proceed to Step 4               |

### Step 4: Handle CI Failure

1. **Report** the failing jobs (name + URL) from `output.failedJobs`
2. **Check fix budget**: run `ci-state-update.mjs gate` — if not allowed, print message and exit
3. **Reproduce locally**: run the failing nx target(s) to confirm and understand the failure
   - Map job names to nx targets using the workflow file (`.github/workflows/ci.yml`)
   - Use `npm exec -- nx affected --target=<target> --base=main`
4. **Fix** the code issue, then run the target again to verify locally
5. **Commit** (stage specific files by name) and **push**
6. Go back to Step 2 to wait for CI to re-run

#### Environment vs code failures

Before attempting a fix, assess whether the failure is environmental (OOM, network timeout, missing binary, permission denied) or a code issue (lint error, test failure, type error). **Environmental failures: bail immediately** — do not spend fix budget on them, report to the user instead.

## Git Safety

- Stage specific files by name — never `git add -A` or `git add .`
- Follow commit message conventions from `.agents/conventions/`

## Error Handling

| Error                  | Action                                |
| ---------------------- | ------------------------------------- |
| No PR found for branch | Exit with guidance                    |
| Subagent spawn failure | Retry once, then exit with error      |
| Decision script error  | Treat as no-progress, increment count |
| Local fix fails        | Report to user, check budget, retry   |
| Local target not found | Report to user, exit                  |
