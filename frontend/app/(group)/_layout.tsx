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
        headerTitleStyle: { fontWeight: "bold", fontSize: 20, color: '#4A3DE3' },
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
        name="subscriptionInfo"
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
        name="subscriptionDetails"
        options={{
          title: "",
          headerTitle: () => null,
          headerShown: false, // This removes the duplicate header
        }}
      />
      <Stack.Screen
        name="newGroupDetails"
        options={{
          title: "",
          headerTitle: () => null,
        }}
      />
      <Stack.Screen
        name="userGroups"
        options={{
          headerShown: false,
          title: 'My Groups'
        }}
      />
      <Stack.Screen
          name = "showAllInvitations"
          options={{ title: "", 
                    headerTitle: () => null,
                    headerLeft: () => null,}}
      />
      <Stack.Screen
          name="setMemberShares"
          options={{
            title: "Set member shares",
            headerTitle: () => null,
          }}
      />
      <Stack.Screen
        name="groupDetails"
        options={{
          headerShown: false, // This removes the duplicate header
        }}
      />
      <Stack.Screen
          name="createGroupVirtualCard"
          options={{
            title: "",
            headerTitle: () => null,
          }}
      />
      <Stack.Screen
          name="subscribeInstruction"
          options={{
            title: "",
            headerTitle: () => null,
          }}
      />
      <Stack.Screen
          name="addGroupCredentials"
          options={{
            title: "",
            headerTitle: () => null,
          }}
      />
    </Stack>

  );
}
