# Database Migrations

## What it does

Sets up Drizzle ORM as the database access layer and migration tool. Defines the initial schema with two tables (`pokemon` and `game`) and provides factory functions for creating a database connection.

## Scope

| File                              | Purpose                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| `drizzle.config.ts`               | Drizzle Kit config — points at schema and migrations folder |
| `apps/api/src/app/db/schema.ts`   | Table definitions (Drizzle schema)                          |
| `apps/api/src/app/db/client.ts`   | `createPool` and `createDb` factory functions               |
| `apps/api/src/app/db/migrations/` | Generated SQL migration files (committed to repo)           |

## Schema

### `pokemon`

| Column       | Type        | Notes                                           |
| ------------ | ----------- | ----------------------------------------------- |
| `id`         | `integer`   | Primary key — PokeAPI national dex number       |
| `name`       | `text`      | Pokemon name                                    |
| `types`      | `text[]`    | Array of type names (e.g. `['fire', 'flying']`) |
| `sprite_url` | `text`      | Nullable — URL to the default sprite            |
| `fetched_at` | `timestamp` | When this row was last fetched from PokeAPI     |

### `game`

| Column                 | Type        | Notes                                           |
| ---------------------- | ----------- | ----------------------------------------------- |
| `id`                   | `uuid`      | Primary key, generated with `gen_random_uuid()` |
| `revealed_pokemon_ids` | `integer[]` | Ordered list of revealed team members           |
| `answer_pokemon_id`    | `integer`   | FK → `pokemon.id` — the correct last Pokemon    |
| `created_at`           | `timestamp` | Row creation time                               |

## API contract

No HTTP endpoints. This is infrastructure only.

## NX targets

| Target                   | Command                | Notes                                        |
| ------------------------ | ---------------------- | -------------------------------------------- |
| `nx run api:db:generate` | `drizzle-kit generate` | Generate a new migration from schema changes |
| `nx run api:db:migrate`  | `drizzle-kit migrate`  | Apply pending migrations to the database     |
| `nx run api:db:studio`   | `drizzle-kit studio`   | Open Drizzle Studio for local DB inspection  |

## Edge cases

- The `DATABASE_URL` env var must be set before running any `db:*` targets
- `db:migrate` must be run against a fresh database before integration tests will pass
- Migration files in `apps/api/src/app/db/migrations/` are committed and should never be edited manually — regenerate via `db:generate` instead
- Local dev uses port `5433` (see `docker/docker-compose.yml`) to avoid conflicts — CI uses the default `5432`
