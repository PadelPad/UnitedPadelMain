import { Tabs } from "expo-router";
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home/index" options={{ title: "Home" }} />
      <Tabs.Screen name="leaderboard/index" options={{ title: "Leaderboard" }} />
      <Tabs.Screen name="submit/index" options={{ title: "Submit" }} />
      <Tabs.Screen name="tournaments/index" options={{ title: "Tournaments" }} />
      <Tabs.Screen name="notifications/index" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile/index" options={{ title: "Profile" }} />
    </Tabs>
  );
}
