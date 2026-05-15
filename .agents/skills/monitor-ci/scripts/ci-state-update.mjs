#!/usr/bin/env node

/**
 * CI State Update Script (GitHub Actions)
 *
 * Manages the local fix attempt budget.
 *
 * Usage:
 *   node ci-state-update.mjs gate \
 *     --fix-attempt-count <n> \
 *     --max-fix-attempts <n>
 */

const args = process.argv.slice(2);
const command = args[0];

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

function output(result) {
  console.log(JSON.stringify(result));
}

function gate() {
  const count = parseInt(getArg('--fix-attempt-count') || '0', 10);
  const max = parseInt(getArg('--max-fix-attempts') || '3', 10);

  if (count >= max) {
    return output({
      allowed: false,
      fixAttemptCount: count,
      message: `Fix budget exhausted (${count}/${max} attempts). Investigate CI logs manually.`,
    });
  }

  return output({
    allowed: true,
    fixAttemptCount: count + 1,
    message: null,
  });
}

switch (command) {
  case 'gate':
    gate();
    break;
  default:
    output({ error: `Unknown command: ${command}` });
}
