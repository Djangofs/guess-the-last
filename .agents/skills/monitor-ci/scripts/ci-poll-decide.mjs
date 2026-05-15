#!/usr/bin/env node

/**
 * CI Poll Decision Script (GitHub Actions)
 *
 * Deterministic decision engine for CI monitoring via GitHub check runs.
 * Takes check_runs JSON + state args, outputs a single JSON action line.
 *
 * Usage:
 *   node ci-poll-decide.mjs '<check_runs_json>' <poll_count> <verbosity> \
 *     [--no-progress-count <n>] \
 *     [--prev-conclusions '<json>'] \
 *     [--timeout <seconds>]
 */

// --- Arg parsing ---

const args = process.argv.slice(2);
const checkRunsJson = args[0];
const pollCount = parseInt(args[1], 10) || 0;
const verbosity = args[2] || 'medium';

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const inputNoProgressCount = parseInt(getArg('--no-progress-count') || '0', 10);
const prevConclusionsJson = getArg('--prev-conclusions');
const timeoutSeconds = parseInt(getArg('--timeout') || '0', 10);

// --- Parse check runs ---

let checkRuns;
try {
  const parsed = JSON.parse(checkRunsJson);
  // GitHub MCP returns { check_runs: [...], total_count: n } or just the array
  checkRuns = Array.isArray(parsed)
    ? parsed
    : (parsed.check_runs ?? parsed.checkRuns ?? []);
} catch {
  console.log(
    JSON.stringify({
      action: 'done',
      code: 'error',
      message: 'Failed to parse check_runs JSON',
      noProgressCount: inputNoProgressCount + 1,
    }),
  );
  process.exit(0);
}

let prevConclusions;
try {
  prevConclusions = prevConclusionsJson
    ? JSON.parse(prevConclusionsJson)
    : null;
} catch {
  prevConclusions = null;
}

// --- Helpers ---

const FAILURE_CONCLUSIONS = new Set([
  'failure',
  'timed_out',
  'action_required',
]);
const SUCCESS_CONCLUSIONS = new Set(['success', 'neutral', 'skipped']);

function currentConclusions() {
  return checkRuns.reduce((acc, r) => {
    acc[r.name] = `${r.status}:${r.conclusion ?? ''}`;
    return acc;
  }, {});
}

function hasProgressChanged() {
  if (!prevConclusions) return true;
  const current = currentConclusions();
  return JSON.stringify(current) !== JSON.stringify(prevConclusions);
}

function isTimedOut() {
  if (timeoutSeconds <= 0) return false;
  // Rough estimate: average 60s per poll
  return pollCount * 60 >= timeoutSeconds;
}

function backoff(noProgressCount) {
  const delays = [30, 60, 90];
  return delays[Math.min(noProgressCount, delays.length - 1)];
}

// ============================================================
// classify() — pure decision tree
//
// Priority (top wins):
//   1. timeout                 → done (polling_timeout)
//   2. circuit breaker         → done (circuit_breaker)
//   3. any check still pending → poll (ci_running)
//   4. any check failed        → done (ci_failure)
//   5. any check cancelled     → done (ci_cancelled)
//   6. all checks succeeded    → done (ci_success)
// ============================================================

function classify() {
  if (isTimedOut()) return { action: 'done', code: 'polling_timeout' };
  if (inputNoProgressCount >= 5)
    return { action: 'done', code: 'circuit_breaker' };

  if (checkRuns.length === 0) {
    return { action: 'poll', code: 'ci_running' };
  }

  const pending = checkRuns.filter((r) => r.status !== 'completed');
  if (pending.length > 0)
    return { action: 'poll', code: 'ci_running', extra: { pending } };

  const failed = checkRuns.filter((r) => FAILURE_CONCLUSIONS.has(r.conclusion));
  const cancelled = checkRuns.filter((r) => r.conclusion === 'cancelled');

  if (failed.length > 0)
    return { action: 'done', code: 'ci_failure', extra: { failed } };
  if (cancelled.length > 0) return { action: 'done', code: 'ci_cancelled' };
  return { action: 'done', code: 'ci_success' };
}

// ============================================================
// buildOutput() — maps classification to full JSON output
// ============================================================

function buildOutput(decision) {
  const { action, code, extra } = decision;
  const noProgressCount = hasProgressChanged() ? 0 : inputNoProgressCount + 1;

  let rawMsg;
  switch (code) {
    case 'polling_timeout':
      rawMsg = 'Polling timeout exceeded.';
      break;
    case 'circuit_breaker':
      rawMsg = 'No progress after 5 consecutive polls. Stopping.';
      break;
    case 'ci_running': {
      const names = (
        extra?.pending ?? checkRuns.filter((r) => r.status !== 'completed')
      )
        .map((r) => r.name)
        .join(', ');
      rawMsg = `Waiting: ${names || 'checks pending'}`;
      break;
    }
    case 'ci_success':
      rawMsg = 'All CI checks passed!';
      break;
    case 'ci_cancelled':
      rawMsg = 'CI was cancelled.';
      break;
    case 'ci_failure': {
      const names = (extra?.failed ?? []).map((r) => r.name).join(', ');
      rawMsg = `CI failed: ${names}`;
      break;
    }
    default:
      rawMsg = `Unknown status: ${code}`;
  }

  let message;
  if (verbosity === 'minimal') {
    message = hasProgressChanged() ? rawMsg : null;
  } else if (verbosity === 'verbose') {
    const summary = checkRuns
      .map((r) => `${r.name}: ${r.status}/${r.conclusion ?? 'pending'}`)
      .join(', ');
    message = `Poll #${pollCount + 1} | ${rawMsg}\n${summary}`;
  } else {
    message = `Poll #${pollCount + 1} | ${rawMsg}`;
  }

  const result = { action, code, message, noProgressCount };

  if (action === 'poll') result.delay = backoff(noProgressCount);
  if (extra?.failed) {
    result.failedJobs = extra.failed.map((r) => ({
      name: r.name,
      conclusion: r.conclusion,
      url: r.html_url,
    }));
  }

  console.log(JSON.stringify(result));
}

buildOutput(classify());
