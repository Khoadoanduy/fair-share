import { Stack } from "expo-router";
import BackButton from "@/components/BackButton";
export default function OnboardingLayout() {
  // return <Stack
  //       screenOptions={{
  //         headerShown: true,
  //         headerShadowVisible: false,
  //         headerStyle: { backgroundColor: "transparent" },
  //         headerTitleStyle: { fontWeight: "bold" },
  //       }}
  //     ></Stack>;
  return (
    <Stack
      screenOptions={{
        headerShown:false,
      }}
    ></Stack>
  );
}
