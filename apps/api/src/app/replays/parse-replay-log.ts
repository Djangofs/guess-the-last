export interface ParsedTeams {
  p1: string[];
  p2: string[];
}

const extractSpecies = (pokemonField: string): string =>
  pokemonField.split(',')[0].trim();

export const parseReplayLog = (log: string): ParsedTeams => {
  const p1: string[] = [];
  const p2: string[] = [];

  for (const line of log.split('\n')) {
    const parts = line.split('|');
    if (parts.length < 4) continue;

    const event = parts[1];
    if (event !== 'switch' && event !== 'drag') continue;

    const playerSlot = parts[2];
    const pokemonField = parts[3];
    const species = extractSpecies(pokemonField);

    if (playerSlot.startsWith('p1')) {
      if (!p1.includes(species)) p1.push(species);
    } else if (playerSlot.startsWith('p2')) {
      if (!p2.includes(species)) p2.push(species);
    }
  }

  return { p1, p2 };
};
