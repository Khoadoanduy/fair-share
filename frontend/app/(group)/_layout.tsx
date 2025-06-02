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

  return (
    <Stack
    screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "bold" },
        headerLeft: () => <BackButton />, // your custom back button
    }}
    >
    <Stack.Screen
        name="createGroupName"
        options={{
            title: "",
            headerTitle: () => null,
        }}
    />
    <Stack.Screen
        name="SubscriptionInfo"
        options={{
            title: "",
            headerTitle: () => null,
        }}
    />
    <Stack.Screen
        name="customSubscription"
        options={{
            title: "",
            headerTitle: () => null,
        }}
    />
    <Stack.Screen
        name="inviteMember"
        options={{
            title: "",
            headerTitle: () => null,
        }}
    />
    <Stack.Screen
        name = "showAllInvitations"
        options={{ title: ""}}
    />
    </Stack>

  );
}
