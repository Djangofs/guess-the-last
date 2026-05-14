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
