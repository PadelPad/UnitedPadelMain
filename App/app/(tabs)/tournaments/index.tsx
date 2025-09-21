import { View, Text, FlatList } from "react-native";
import { useTournaments } from "@/features/tournaments/hooks";
import { TournamentCard } from "@/features/tournaments/TournamentCard";
export default function Tournaments() {
  const { data, isLoading, error } = useTournaments();
  return (
    <View className="flex-1 bg-black p-4">
      <Text className="text-white text-xl font-semibold mb-3">Tournaments</Text>
      {isLoading ? <Text className="text-white/70">Loading…</Text> :
        error ? <Text className="text-red-400">Couldn’t load tournaments.</Text> :
        <FlatList data={data || []} keyExtractor={(t) => t.id} renderItem={({item}) => <TournamentCard tournament={item} />} />}
    </View>
  );
}
