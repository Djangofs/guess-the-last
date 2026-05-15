export const sharedTypes = (): string => {
  return 'shared-types';
};

export interface Replay {
  id: string;
  replayUrl: string;
  format: string;
  importedAt: Date;
}

export interface Team {
  id: string;
  replayId: string;
  player: string;
  pokemonIds: number[];
  createdAt: Date;
}

export interface ImportReplaysRequest {
  urls: string[];
}

export interface ImportReplaysResponse {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}
