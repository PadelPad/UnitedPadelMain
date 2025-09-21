import { z } from "zod";
export const SetSchema = z.object({ t1: z.number().int().min(0), t2: z.number().int().min(0), superTiebreak: z.boolean().optional() });
export const DraftSchema = z.object({
  matchType: z.enum(['singles','doubles']), matchLevel: z.enum(['friendly','league','tournament','nationals']), date: z.string(),
  team1: z.array(z.string()), team2: z.array(z.string()), sets: z.array(SetSchema).min(2).max(3)
});
export function isValidSet({t1,t2,superTiebreak}:{t1:number;t2:number;superTiebreak?:boolean}) {
  if (superTiebreak) return (t1>=10 || t2>=10) && Math.abs(t1-t2)>=2;
  const mx = Math.max(t1,t2), mn = Math.min(t1,t2);
  if (mx===6 && mn<=4) return true; if (mx===7 && (mn===5||mn===6)) return true; return false;
}
export function validateSets(draft:any){ DraftSchema.parse(draft); if(!draft.sets.every(isValidSet)) throw new Error('Invalid set scores.'); const w1 = draft.sets.filter((s:any)=>s.t1>s.t2).length; if (w1*2===draft.sets.length) throw new Error('Must have a winner.'); }
