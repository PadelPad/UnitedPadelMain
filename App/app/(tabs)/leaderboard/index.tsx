import { View, Text, FlatList } from "react-native";
import { useLeaderboard } from "@/features/leaderboard/hooks";
import { PlayerMiniCard } from "@/features/leaderboard/PlayerMiniCard";
import { FilterBar } from "@/features/leaderboard/FilterBar";

export default function Leaderboard() {
  const { data, isLoading, error } = useLeaderboard({});
  return (
    <View className="flex-1 bg-black p-4">
      <Text className="text-white text-xl font-semibold mb-3">Leaderboard</Text>
      <FilterBar />
      {isLoading ? <Text className="text-white/70 mt-4">Loading…</Text> :
        error ? <Text className="text-red-400 mt-4">Couldn’t load leaderboard.</Text> :
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.user_id}
          renderItem={({item}) => <PlayerMiniCard player={item} />}
          ListEmptyComponent={<Text className="text-white/60 mt-6">No players yet.</Text>}
        />}
    </View>
  );
}
