# Issue-to-PR Workflow

This project uses a GitHub-native issue-to-PR workflow. The agent has access to GitHub via the GitHub MCP server configured in `.claude/settings.json`.

## The Workflow

1. **You create a GitHub issue** describing the feature or fix
2. **You invoke the agent** with the issue number: _"pick up issue #42"_
3. **The agent**:
   - Reads the issue title and description
   - Creates a branch named `feat/<issue-number>-<short-slug>` (or `fix/...` for bugs)
   - Implements the work following the standards in `coding-standards.md`
   - Follows the feature workflow in `feature-workflow.md` (tests, passing, spec doc)
   - Opens a PR that references the issue (`Closes #42` in the body)
4. **You review the PR** and merge when satisfied

## Writing a Good Issue

The agent reads the issue as its spec. Include:

- **What** it should do (user-facing behaviour)
- **Acceptance criteria** — a checklist the agent can use to verify completeness
- **Out of scope** — anything explicitly excluded

The more precise the issue, the less back-and-forth. Think of it as the spec in `.agents/specs/` written before the code.

## GitHub Operations Available

The GitHub MCP server supports:

| Operation | What the agent can do |
|---|---|
| Issues | Create, read, update, close, label, assign |
| Pull Requests | Create, read, update, add reviewers |
| Branches | Create from any ref |
| Files | Read, create, update (single or batch commit) |
| Repo | Read structure, search code |

## Setup

The MCP server requires a GitHub Personal Access Token with `repo` scope:

Add it to your `.env` file (copied from `.env.example`):

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
```
