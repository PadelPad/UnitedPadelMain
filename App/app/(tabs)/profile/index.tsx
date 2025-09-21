import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { AvatarUploader } from "@/features/profile/AvatarUploader";
import { supabase } from "@/lib/supabase";
import { registerForPushAndSave } from "@/lib/notifications/push";
export default function Profile() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(r => setUser(r.data.user));
    registerForPushAndSave().catch(()=>{});
  }, []);
  return (
    <View className="flex-1 bg-black p-4 gap-3">
      <Text className="text-white text-xl font-semibold">Profile</Text>
      <Text className="text-white/80">{user ? user.email : "Signed out"}</Text>
      <AvatarUploader />
    </View>
  );
}
