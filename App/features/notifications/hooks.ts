import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/** We use the compatibility view `notifications_app` which maps to your existing `public.notifications`. */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications_app").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    }
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const { error } = await supabase.from("notifications_app").update({ read: true }).eq("to_user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] })
  });
}
