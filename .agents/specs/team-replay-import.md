# Feature: Team Data Model and Batch Replay Import

## What it does

Introduces a lower-level primitive — a **team** as it was revealed during a battle — sourced from Pokémon Showdown replay URLs. A batch import endpoint accepts replay URLs, fetches and parses each replay's log, resolves species names to Pokémon IDs, and persists one `replay` row and two `team` rows per URL inside a transaction.

## Scope

| Area         | Files                                                        |
| ------------ | ------------------------------------------------------------ |
| DB schema    | `apps/api/src/app/db/schema.ts`                              |
| Migration    | `apps/api/src/app/db/migrations/0001_shallow_liz_osborn.sql` |
| Log parser   | `apps/api/src/app/replays/parse-replay-log.ts`               |
| Service      | `apps/api/src/app/replays/replay-service.ts`                 |
| Route        | `apps/api/src/app/replays/replay-router.ts`                  |
| Shared types | `libs/shared-types/src/lib/shared-types.ts`                  |
| Entry point  | `apps/api/src/main.ts`                                       |

## API Contract

### `POST /api/replays/import`

Protected by `requireApiKey` (Bearer token) and `strictLimiter` (10 req / 15 min).

**Request**

```json
{ "urls": ["https://replay.pokemonshowdown.com/smogtours-gen4ou-900386"] }
```

**Response 200**

```json
{ "imported": 1, "skipped": 0, "failed": 0, "errors": [] }
```

**Response 400** — `urls` missing or empty array.

## Data Model

### `replay`

| Column        | Type                               | Notes                                  |
| ------------- | ---------------------------------- | -------------------------------------- |
| `id`          | `uuid` PK                          |                                        |
| `replay_url`  | `text` UNIQUE NOT NULL             | Full URL                               |
| `format`      | `text` NOT NULL                    | Extracted from URL slug, e.g. `gen4ou` |
| `imported_at` | `timestamp` NOT NULL DEFAULT NOW() |                                        |

### `team`

| Column        | Type                                    | Notes                   |
| ------------- | --------------------------------------- | ----------------------- |
| `id`          | `uuid` PK                               |                         |
| `replay_id`   | `uuid` NOT NULL REFERENCES `replay(id)` |                         |
| `player`      | `text` NOT NULL                         | `"p1"` or `"p2"`        |
| `pokemon_ids` | `integer[]` NOT NULL                    | Ordered by first reveal |
| `created_at`  | `timestamp` NOT NULL DEFAULT NOW()      |                         |

## Edge Cases

- **Already-imported URL**: skipped (upsert-safe), counted in `skipped`, no error.
- **Unknown species**: team is not persisted; URL counted in `failed` with an entry in `errors` naming the unresolved species.
- **Team smaller than 6**: skipped with error — only full teams of 6 are stored.
- **Fetch failure**: caught per-URL; other URLs in the batch are unaffected.
- **Species deduplication**: a Pokémon that switches in multiple times is counted only on first reveal.
- **Species suffix stripping**: `, L100, M` suffixes are stripped before DB lookup; names are lowercased to match the `pokemon` table.
