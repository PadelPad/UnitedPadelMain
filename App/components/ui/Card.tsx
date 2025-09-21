import { View, ViewProps } from "react-native";
export const Card = ({ children, ...rest }: ViewProps) => (
  <View {...rest} className="rounded-2xl bg-neutral-900/70 border border-white/10 p-4 shadow-lg">{children}</View>
);
