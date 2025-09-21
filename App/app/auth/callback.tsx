import { useEffect } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        const access_token = params['access_token'] as string | undefined;
        const refresh_token = params['refresh_token'] as string | undefined;
        const code = params['code'] as string | undefined;
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        } else if (code && 'exchangeCodeForSession' in supabase.auth) {
          // @ts-ignore
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {}
      router.replace("/(tabs)/home");
    })();
  }, []);
  return <View className="flex-1 items-center justify-center bg-black"><Text className="text-white">Completing sign-in…</Text></View>;
}
