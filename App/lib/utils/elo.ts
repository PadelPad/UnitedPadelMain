export type MatchLevel = 'friendly'|'league'|'tournament'|'nationals';
export const K: Record<MatchLevel, number> = { friendly: 16, league: 32, tournament: 50, nationals: 75 };
export function expected(a: number, b: number) { return 1 / (1 + Math.pow(10, (b - a) / 400)); }
export function marginMultiplier(sets: {t1:number; t2:number; superTiebreak?:boolean}[]) {
  const diff = sets.reduce((acc,s)=> acc + Math.abs(s.t1 - s.t2), 0); return Math.min(1.4, 1 + diff / 12);
}
export function updateRating(r: number, opp: number, res: 0|0.5|1, lvl: MatchLevel, mm: number) {
  const e=expected(r,opp); const d=Math.round(K[lvl]*mm*(res-e)); const c=(res>0 && d<1)?1:d; return { after: r+c, delta: c };
}
