import { View, Text, FlatList } from "react-native";
import { useNotifications, useMarkAllRead } from "@/features/notifications/hooks";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { Button } from "@/components/ui/Button";
export default function Notifications() {
  const { data, isLoading, error } = useNotifications();
  const markAll = useMarkAllRead();
  return (
    <View className="flex-1 bg-black p-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-white text-xl font-semibold">Notifications</Text>
        <Button title="Mark all read" onPress={() => markAll.mutate()} />
      </View>
      {isLoading ? <Text className="text-white/70 mt-4">Loading…</Text> :
        error ? <Text className="text-red-400 mt-4">Couldn’t load notifications.</Text> :
        <FlatList
          data={data || []}
          keyExtractor={(n) => n.id}
          renderItem={({item}) => <NotificationItem item={item} />}
          ListEmptyComponent={<Text className="text-white/70 mt-6">You’re all caught up!</Text>}
        />}
    </View>
  );
}
