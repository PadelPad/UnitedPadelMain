export type MatchDraft = {
  matchType: 'singles'|'doubles';
  matchLevel: 'friendly'|'league'|'tournament'|'nationals';
  date: string;
  team1: string[];
  team2: string[];
  sets: { t1:number; t2:number; superTiebreak?: boolean }[];
  notes?: string;
  client_mutation_id?: string;
};
