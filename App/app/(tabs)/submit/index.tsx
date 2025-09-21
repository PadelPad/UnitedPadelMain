import { View, Text } from "react-native";
import { Stepper } from "@/features/match/Stepper";
export default function Submit() {
  return (
    <View className="flex-1 bg-black">
      <Text className="text-white text-xl font-semibold p-4">Submit Match</Text>
      <Stepper />
    </View>
  );
}
