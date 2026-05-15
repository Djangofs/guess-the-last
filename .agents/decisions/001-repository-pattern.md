# ADR 001: Repository Pattern for Data Access

**Status:** Accepted  
**Date:** 2026-05-15

## Context

The first API feature (replay import) was written with the database handle (`db`) passed directly into the service function. The service called Drizzle directly for all queries: deduplication checks, Pokémon name lookups, and the transactional insert of `replay`+`team` rows.

This works but has a cost: the service is coupled to Drizzle's API surface and the concrete schema. Unit-testing the service logic requires either a live database or mocking Drizzle internals, neither of which is clean.

## Decision

All database access is encapsulated behind a **repository interface**. The service depends on the interface, not on Drizzle or the schema directly.

```
router → service(repo) → ReplayRepository (interface)
                                ↓
                     DrizzleReplayRepository (impl)
                                ↓
                              Drizzle / Postgres
```

Each feature area gets its own repository file:

- `replay-repository.ts` — defines `ReplayRepository` interface + `createReplayRepository(db)` factory

The router receives a repository instance (created in `main.ts`) and passes it to the service. The service is a pure function of the repository interface and has no import of Drizzle or schema.

## Consequences

**Benefits**

- Service logic is testable without a database: mock the three-method interface, not Drizzle internals
- Queries are co-located in one file per entity; the service reads as business logic only
- Swapping the ORM or splitting the DB later only touches the repository implementation

**Costs**

- One extra file per feature area
- The repository interface must be kept in sync with the service's needs as features evolve

## What this is not

The repository is not a generic CRUD layer. Each repository exposes only the methods the service actually calls — `existsByUrl`, `resolvePokemonIds`, `createWithTeams` — not a full set of find/update/delete operations. Adding methods only when a service needs them keeps the interface minimal.
