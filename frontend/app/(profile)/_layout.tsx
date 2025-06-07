import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // We handle headers in individual screens
      }}
    >
      <Stack.Screen
        name="personalInfo"
        options={{
          title: "Personal Information",
        }}
      />
    </Stack>
  );
}