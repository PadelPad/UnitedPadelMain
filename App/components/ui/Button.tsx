import { Pressable, Text, ViewStyle } from "react-native";
type Props = { title: string; onPress?: () => void; disabled?: boolean; style?: ViewStyle };
export const Button = ({ title, onPress, disabled, style }: Props) => (
  <Pressable accessibilityRole="button" className={`rounded-2xl px-4 py-3 ${disabled ? 'bg-gray-600' : 'bg-orange-500'}`} onPress={onPress} disabled={disabled} style={style}>
    <Text className="text-white text-center text-base font-semibold">{title}</Text>
  </Pressable>
);
