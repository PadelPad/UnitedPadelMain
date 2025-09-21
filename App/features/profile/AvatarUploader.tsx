import { useState } from "react";
import { View, Text, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
export function AvatarUploader() {
  const [uri, setUri] = useState<string|undefined>();
  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };
  const upload = async () => {
    if (!uri) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const path = `avatars/${user.id}.jpg`;
    const file = await fetch(uri).then(r => r.blob());
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: "image/jpeg" });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
    }
  };
  return (
    <View className="gap-3">
      {uri && <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 999 }} />}
      <Button title="Pick avatar" onPress={pick} />
      <Button title="Upload" onPress={upload} />
      <Text className="text-white/60 text-xs">Requires Supabase Storage bucket "avatars" (public).</Text>
    </View>
  );
}
