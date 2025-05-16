import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [needsUserOnboarding, setNeedsUserOnboarding] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // TEMPORARY: Reset onboarding status for testing
    // Remove this block after testing
    AsyncStorage.removeItem("onboardingComplete")
      .then(() => console.log("Onboarding reset for testing"))
      .catch(err => console.error("Failed to reset:", err));

    async function checkStatus() {
      try {
        const [onboardingStatus, userOnboardingStatus] = await Promise.all([
          AsyncStorage.getItem("onboardingComplete"),
          AsyncStorage.getItem("needsUserOnboarding")
        ]);

        setOnboardingComplete(onboardingStatus === "true");
        setNeedsUserOnboarding(userOnboardingStatus === "true");
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  if (loading || !isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4353FD" />
      </View>
    );
  }
  // Signed-up & logged-in user who needs post-signup onboarding

  // First-time visitor sees initial onboarding
  if (!onboardingComplete) {
    console.log("First time");
    return <Redirect href="/(onboarding)" />;
    
  }

  // Not signed in user sees welcome screen
  if (!isSignedIn) {
    console.log("Not signed in");
    return <Redirect href="/(onboarding)" />;
  }

  // Otherwise go to main app
  return <Redirect href="/(tabs)" />;
}