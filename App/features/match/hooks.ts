import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MatchDraft } from "@/types";

export function useCreateMatch(){
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: MatchDraft) => {
      const payload = {
        matchType: draft.matchType,
        matchLevel: draft.matchLevel,
        date: draft.date,
        team1: draft.team1,
        team2: draft.team2,
        sets: draft.sets,
        notes: draft.notes ?? null,
        client_mutation_id: draft.client_mutation_id ?? null
      };
      const { data, error } = await supabase.rpc('create_match', { payload });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    }
  });
}
