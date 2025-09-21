import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
export function useLeaderboard(filters: any) {
  return useQuery({
    queryKey: ["leaderboard", filters],
    queryFn: async () => {
      const { data, error } = await supabase.from("leaderboard_view_app").select("*");
      if (error) throw error; return data as any[];
    }, staleTime: 60_000
  });
}
