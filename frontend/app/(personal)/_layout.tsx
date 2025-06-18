import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import BackButton from "../../components/BackButton";

export default function PersonalLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
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
        name="personalSubscriptionChoice"
        options={{
          title: "",
          headerTitle: () => null,
        }}
      />
      <Stack.Screen
        name="personalSubscriptionInfo"
        options={{
          title: "",
          headerTitle: () => null,
        }}
      />
      <Stack.Screen
        name="customPersonalSubscription"
        options={{
          title: "",
          headerTitle: () => null,
        }}
      />
      <Stack.Screen
        name="personalSubscriptionDetails"
        options={{
          title: "",
          headerTitle: () => null,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="createVirtualCard"
        options={{
          title: "",
          headerTitle: () => null,
        }}
      />
      <Stack.Screen
        name="addAccountCredentials"
        options={{
          title: "",
          headerShown: false,
        }}
      />
    </Stack>
  );
}