import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const pokemon = pgTable('pokemon', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  types: text('types').array().notNull(),
  spriteUrl: text('sprite_url'),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
});

export const game = pgTable('game', {
  id: uuid('id').defaultRandom().primaryKey(),
  revealedPokemonIds: integer('revealed_pokemon_ids').array().notNull(),
  answerPokemonId: integer('answer_pokemon_id')
    .references(() => pokemon.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const replay = pgTable('replay', {
  id: uuid('id').defaultRandom().primaryKey(),
  replayUrl: text('replay_url').unique().notNull(),
  format: text('format').notNull(),
  importedAt: timestamp('imported_at').defaultNow().notNull(),
});

export const team = pgTable('team', {
  id: uuid('id').defaultRandom().primaryKey(),
  replayId: uuid('replay_id')
    .references(() => replay.id)
    .notNull(),
  player: text('player').notNull(),
  pokemonIds: integer('pokemon_ids').array().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
