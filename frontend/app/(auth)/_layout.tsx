import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import BackButton from "../../components/BackButton";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href={"/(tabs)"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "bold" },
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: "Log In",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: "Sign Up",
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="verify"
        options={{
          title: "Verify Email",
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
