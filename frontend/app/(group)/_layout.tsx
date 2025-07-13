import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View, TouchableOpacity } from "react-native";
import BackButton from "../../components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter(); 

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const handleHomePress = () => {
    router.push({ pathname: "/(tabs)/groups" });
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontSize: 20, color: '#4A3DE3' },
        headerLeft: () => <BackButton />, 
        headerRight: () => (
          <TouchableOpacity onPress={handleHomePress} style={{ marginRight: 10 }}>
            <Ionicons name="home" size={24} color="#4A3DE3" />
          </TouchableOpacity>
        ),

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
        name="SubscriptionDetails"
        options={{
          title: "Subscription Details",
          headerTitle: () => null,
        }}
      />
      <Stack.Screen
        name="newGroupDetails"
        options={{
          title: "Group Details",
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
          options={{ title: "Manage Subscriptions", 
                    headerTitle: () => null,
                    }}
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
            title: "Group Details",
            headerTitle: () => null,
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
            headerRight: () => null,
          }}
      />
      <Stack.Screen
        name="confirmInfo"
        options={{
          headerShown: false,
        }}
      />
    </Stack>

  );
}
