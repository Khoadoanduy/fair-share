import { use, useRef, useState, useEffect } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  TouchableOpacity,
} from "react-native";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useAppDispatch } from "@/redux/hooks";
import { setOnboardingComplete } from "@/redux/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/clerk-expo";
import { useUserState } from "@/hooks/useUserState";
import { on } from "events";
const { width } = Dimensions.get("window");

type Feature = {
  id: string;
  title?: string;
  description?: string;
  component?: JSX.Element;
};

export default function OnboardingScreen() {
  const { onboardingComplete,isSignedIn } = useUserState();
  const flatListRef = useRef<FlatList<Feature>>(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const dispatch = useAppDispatch();
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animated value for background color transition
  const animatedBackgroundColor = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: ["#4A3DE3", "#FFFFFF", "#FFFFFF"],
    extrapolate: "clamp",
  });

  const footerOpacity = scrollX.interpolate({
    inputRange: [width * 2, width * 3],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Early return if signed in
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }
  if (onboardingComplete && !isSignedIn){

  }
  const handleComplete = async () => {
    try {
      dispatch(setOnboardingComplete(true));
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  const handleSignUp = async () => {
    if (isSignedIn) {
      router.replace("/(tabs)");
      return;
    }
    
    router.push("/(auth)/sign-up");
    await handleComplete();
  };

  const handleLogIn = async () => {
    if (isSignedIn) {
      router.replace("/(tabs)");
      return;
    }
    await handleComplete();
    router.push("/(auth)/sign-in");
  };

  const features: Feature[] = [
    {
      id: "1",
      component: (
        <View style={welcomeStyles.content}>
          <View style={welcomeStyles.logoContainer}>
            <Image
              source={require("../assets/FairShare_logo.png")}
              style={welcomeStyles.logoBox}
            />
            <Text style={welcomeStyles.title}>Fair Share</Text>
            <Text style={welcomeStyles.subtitle}>
              Shared subscriptions, simplified.
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: "2",
      description:
        "Manage all your subscriptions, both personal and shared, and keep track of what's active, upcoming, or on trial.",
    },
    {
      id: "3",
      description:
        "Start or join groups, add members, and manage shared subscriptions together. From payments to renewals, keep things in sync.",
    },
    {
      id: "4",
      description:
        "Never miss a renewal, OTP, or group update. Smart reminders and real-time alerts keep your subscriptions running smoothly.",
    },
  ];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentFeature(idx);
  };

  const handleScrollEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const goBack = () => {
    if (currentFeature > 0) {
      const prev = currentFeature - 1;
      flatListRef.current?.scrollToOffset({
        offset: prev * width,
        animated: true,
      });
      setCurrentFeature(prev);
    }
  };

  const renderItem = ({ item, index }: { item: Feature; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const renderTitle = () => {
      if (index === 1) {
        return (
          <View style={styles.titleContainer}>
            <Text style={styles.featureTitle}>Your subscriptions,</Text>
            <Text style={styles.featureTitle}>
              all in <Text style={styles.highlightedText}>one place.</Text>
            </Text>
          </View>
        );
      } else if (index === 2) {
        return (
          <View style={styles.titleContainer}>
            <Text style={styles.featureTitle}>Share subscriptions</Text>
            <Text style={styles.highlightedText}>seamlessly.</Text>
          </View>
        );
      } else if (index === 3) {
        return (
          <View style={styles.titleContainer}>
            <Text style={styles.featureTitle}>
              Get <Text style={styles.highlightedText}>notified</Text>
            </Text>
            <Text style={styles.featureTitle}>
              and stay <Text style={styles.highlightedText}>in control.</Text>
            </Text>
          </View>
        );
      }
      return null;
    };

    return (
      <Animated.View
        style={[
          styles.pageContainer,
          { width },
          index === 0 ? { backgroundColor: "#4A3DE3" } : null,
          (index === 0 || index === 1) && { opacity },
        ]}
      >
        {item.component ? (
          item.component
        ) : (
          <View style={styles.contentContainer}>
            <Image
              source={require("../assets/placeholderFrame.png")}
              style={styles.imageBox}
            />

            {renderTitle()}

            <Text style={styles.featureDescription}>{item.description}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: animatedBackgroundColor }]}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Back button */}
        {currentFeature > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#4A3DE3" />
          </TouchableOpacity>
        )}

        <Animated.View style={styles.dotsContainer}>
          {features.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentFeature ? 24 : 8,
                  backgroundColor:
                    currentFeature > 0
                      ? // After first screen - use these colors
                        i === currentFeature
                        ? "#4A3DE3"
                        : "#D3D3D3" // Active dot is purple, inactive is light gray
                      : // First screen (currentFeature = 0) - use original colors
                      i === currentFeature
                      ? scrollX.interpolate({
                          inputRange: [0, width / 2],
                          outputRange: ["#FFFFFF", "#000000"],
                          extrapolate: "clamp",
                        })
                      : "rgba(255,255,255,0.5)",
                },
              ]}
            />
          ))}
        </Animated.View>

        <Animated.FlatList
          ref={flatListRef}
          data={features}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScrollEvent}
          onMomentumScrollEnd={handleScroll}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEventThrottle={30}
        />

        
        <Animated.View
          style={[styles.footer, { opacity: footerOpacity }]}
          // set pointerEvents to auto as conditional check with Animated value is unsupported
          pointerEvents="auto"
        >
          <CustomButton
            text="Sign Up"
            onPress={handleSignUp}
            style={styles.signUpButton}
            textStyle={styles.signUpText}
          />
          <CustomButton
            text="Log In"
            onPress={handleLogIn}
            style={styles.logInButton}
            textStyle={styles.logInText}
          />
        </Animated.View>
        
      </SafeAreaView>
    </Animated.View>
  );
}

// Imported styles from Welcome Screen
const welcomeStyles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  logoBox: {
    width: 149,
    height: 149,
    backgroundColor: "#4A3DE3",
    marginBottom: 20,
    borderRadius: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#FCFBFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FCFBFF",
    textAlign: "center",
    marginHorizontal: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  safeArea: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 0,
    textAlign: "left",
  },
  highlightedText: {
    fontSize: 28,
    color: "#4A3DE3",
    fontWeight: "bold",
  },
  featureDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    marginBottom: 30,
    textAlign: "left",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  backButton: {
    position: "absolute",
    top: 80,
    left: 20,
    zIndex: 10,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "column",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
  },

  signUpButton: {
    backgroundColor: "#4A3DE3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  signUpText: { color: "white" },
  logInButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "#4A3DE3",
  },
  logInText: { color: "#4A3DE3" },
  imageBox: {
    width: 345,
    height: 354,
    borderRadius: 20,
    marginBottom: 20,
  },
});
