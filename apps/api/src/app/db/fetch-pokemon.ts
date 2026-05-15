import { writeFileSync } from 'fs';
import { join } from 'path';

const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon';
const BATCH_SIZE = 10;
const DELAY_MS = 100;
const GEN_1_4_COUNT = 493;

interface PokeApiPokemon {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
}

interface PokemonRecord {
  id: number;
  name: string;
  types: string[];
  spriteUrl: string;
}

async function fetchPokemon(id: number): Promise<PokeApiPokemon> {
  const res = await fetch(`${POKEAPI_BASE}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch pokemon ${id}: ${res.status}`);
  return res.json() as Promise<PokeApiPokemon>;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAll() {
  const records: PokemonRecord[] = [];

  console.log(`Fetching ${GEN_1_4_COUNT} Pokémon from PokéAPI...`);

  for (let start = 1; start <= GEN_1_4_COUNT; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, GEN_1_4_COUNT);
    const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const results = await Promise.all(ids.map(fetchPokemon));

    records.push(
      ...results.map((p) => ({
        id: p.id,
        name: p.name,
        types: p.types.map((t) => t.type.name),
        spriteUrl: `${SPRITE_BASE}/${p.id}.png`,
      }))
    );

    console.log(`  ${records.length}/${GEN_1_4_COUNT} (ids ${ids[0]}–${ids[ids.length - 1]})`);

    if (end < GEN_1_4_COUNT) await sleep(DELAY_MS);
  }

  const outPath = join(__dirname, 'pokemon-data.json');
  writeFileSync(outPath, JSON.stringify(records, null, 2));
  console.log(`Wrote ${records.length} Pokémon to ${outPath}`);
}

fetchAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
