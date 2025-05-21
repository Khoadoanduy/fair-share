import { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Image } from "react-native";
import { Redirect } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUserOnboardingComplete } from "@/redux/slices/userSlice";
import { router } from "expo-router";
export default function EmailVerified() {
  const [redirectReady, setRedirectReady] = useState(false);
  const dispatch = useAppDispatch();
  const needsUserOnboarding = useAppSelector(
    (state) => state.user.needsUserOnboarding
  );

  const handleNext = () => {
    console.log("EmailVerified: Marking user onboarding as complete");
    dispatch(setUserOnboardingComplete(false));
    console
    setRedirectReady(true);
    router.push("/(collectpayment)/CollectPayment")
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>
            Your email is{" "}
            <Text style={{ color: "#4A3DE3", fontWeight: "600" }}>
              verified
            </Text>
            ! 🎉
          </Text>
          <Text style={styles.subtitle}>
            You’re one step closer to managing your subscriptions with ease.
          </Text>
          <Image
            source={require("../assets/placeholderFrame.png")}
            style={styles.logoBox}
          />
          <CustomButton
            text="Next - Create personal card"
            style={styles.nextButton}
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  contentWrapper: {
    width: 345,
  },
  logoBox: {
    marginTop: 20,
    width: 345,
    height: 374,
    borderRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 600,
    textAlign: "left",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "left",
    marginHorizontal: 20,
    lineHeight: 28,
    marginLeft: 0,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: "#4A3DE3",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 40,
  },
});
