import { View, Text } from "react-native";
import { Link } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
export default function Home() {
  return (
    <View className="flex-1 bg-black p-4 gap-3">
      <Text className="text-white text-2xl font-bold">United Padel</Text>
      <Card><Text className="text-white/90">Log matches, climb the ranks, earn badges.</Text></Card>
      <Link href="/(tabs)/submit" asChild><Button title="Submit Match" /></Link>
    </View>
  );
}
