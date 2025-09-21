import { create } from "zustand";
import { MatchDraft } from "@/types";
const initial: MatchDraft = { matchType: 'doubles', matchLevel: 'friendly', date: new Date().toISOString().slice(0,10), team1: [], team2: [], sets: [{ t1: 0, t2: 0 }] };
type State = { draft: MatchDraft; setField: <K extends keyof MatchDraft>(k:K,v:MatchDraft[K])=>void; reset:()=>void; canSubmit:()=>boolean; };
export const useMatchDraft = create<State>((set,get)=> ({
  draft: initial,
  setField: (k,v)=> set(s=>({ draft: { ...s.draft, [k]: v } })),
  reset: ()=> set({ draft: initial }),
  canSubmit: ()=> { const d=get().draft; const size=d.matchType==='doubles'?2:1; return d.team1.length===size && d.team2.length===size && d.sets.length>=2; }
}));
