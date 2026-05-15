import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createDb, createPool } from './client';
import { pokemon } from './schema';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

interface PokemonRecord {
  id: number;
  name: string;
  types: string[];
  spriteUrl: string;
}

async function seed() {
  const pool = createPool(DATABASE_URL as string);
  const db = createDb(pool);

  const data: PokemonRecord[] = JSON.parse(
    readFileSync(join(__dirname, 'pokemon-data.json'), 'utf-8'),
  );

  console.log(`Seeding ${data.length} Pokémon...`);

  await db
    .insert(pokemon)
    .values(
      data.map((p) => ({
        id: p.id,
        name: p.name,
        types: p.types,
        spriteUrl: p.spriteUrl,
      })),
    )
    .onConflictDoNothing();

  await pool.end();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
