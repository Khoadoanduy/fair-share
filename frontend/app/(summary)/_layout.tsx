import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import BackButton from "../../components/BackButton";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "bold", color: '#4A3DE3' },
        headerLeft: () => <BackButton />, // your custom back button
      }}
    >
      <Stack.Screen
          name="visualization"
          options={{
            title: "",
            headerTitle: () => null,
          }}
      />
      
    </Stack>

  );
}
