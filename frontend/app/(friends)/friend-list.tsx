import { Stack } from "expo-router";
import FriendListScreen from "../../screens/FriendListScreen";

export default function FriendListRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "My Friends" }} />
      <FriendListScreen />
    </>
  );
}