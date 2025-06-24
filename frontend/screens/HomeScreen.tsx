import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import PaymentMethod from "@/components/PaymentMethod";
import { useUserState } from "@/hooks/useUserState";
import { useEffect } from "react";
import CustomButton from "@/components/CustomButton";
import { Redirect } from "expo-router";
import { useAppDispatch } from "@/redux/hooks";
import { fetchUserData } from "@/redux/slices/userSlice";
import { usePushNotifications } from "@/utils/notificationUtils";

// Set to true to show the Redux debugger, false to hide it
const SHOW_REDUX_DEBUGGER = true;

export default function HomeScreen() {
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const { name, hasPayment, userId, stripeCustomerId, isSignedIn } =
    useUserState();

  usePushNotifications(userId || '');


  const handleForceRefresh = async () => {
    if (user?.id) {
      try {
        await dispatch(fetchUserData(user.id)).unwrap();
        Alert.alert("Success", "Data refreshed successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to refresh data");
      }
    }
  };

  const handleNext = () => {
    router.push("/(collectpayment)/CollectPayment");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {isSignedIn ? (
            <>
              <Image
                source={{ uri: user?.imageUrl }}
                style={styles.profileImage}
              />
              <Text style={styles.welcomeText}>Welcome, {name}</Text>
              <Text style={styles.subtitle}>
                What would you like to do today?
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.welcomeText}>Hi, {name}</Text>
              <Text style={styles.welcomeText}>Welcome to Fair Share</Text>
              <Text style={styles.subtitle}>
                The easiest way to split expenses with friends and family
              </Text>
            </>
          )}
        </View>
        <CustomButton text="Refresh Data" onPress={handleForceRefresh} />
        <CustomButton text="Next - Create personal card" onPress={handleNext} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  profileImage: {
    height: 100,
    aspectRatio: 1,
    borderRadius: 100,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
