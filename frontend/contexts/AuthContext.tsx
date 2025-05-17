import React, {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
  import { useAuth } from "@clerk/clerk-expo";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  
  type AuthContextType = {
    isSignedIn: boolean;
    isLoaded: boolean;
    onboardingComplete: boolean;
    needsUserOnboarding: boolean;
    loading: boolean;
    markOnboardingComplete: () => Promise<void>;
    markUserOnboardingComplete: () => Promise<void>;
  };
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isSignedIn, isLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState(false);
    const [needsUserOnboarding, setNeedsUserOnboarding] = useState(false);
  
    useEffect(() => {
      if (!isLoaded) {
        //wait for Clerk
        return;
      }
  
      setLoading(true);
      (async () => {
        try {
          // 1) Pre–signup onboarding flag
          const storedOnboarding = await AsyncStorage.getItem(
            "onboardingComplete"
          );
          setOnboardingComplete(storedOnboarding === "false");
  
          // 2) Post–signup “user onboarding” only once you’re actually signed in
          if (isSignedIn) {
            setOnboardingComplete(storedOnboarding === "true");
            const storedUserOnboarding = await AsyncStorage.getItem(
              "needsUserOnboarding"
            );
            // If this is the first time we ever see a key, assume they DO need setup
            if (storedUserOnboarding === null) {
              setNeedsUserOnboarding(true);
            } else {
              
              setNeedsUserOnboarding(storedUserOnboarding === "true");
            }
          } else {
            // if not signed in, we don’t care about user‐onboarding yet
            setNeedsUserOnboarding(false);
          }
        } catch (err) {
          console.error("Error loading onboarding flags:", err);
        } finally {
          setLoading(false);
        }
      })();
    }, [isLoaded, isSignedIn]);
  
    const markOnboardingComplete = async () => {
      try {
        await AsyncStorage.setItem("onboardingComplete", "true");
        setOnboardingComplete(true);
      } catch (err) {
        console.error("Failed to save onboardingComplete:", err);
      }
    };
  
    const markUserOnboardingComplete = async () => {
      try {
        await AsyncStorage.setItem("needsUserOnboarding", "false");
        setNeedsUserOnboarding(false);
      } catch (err) {
        console.error("Failed to save needsUserOnboarding:", err);
      }
    };
  
    return (
      <AuthContext.Provider
        value={{
          isSignedIn: isSignedIn || false,
          isLoaded,
          onboardingComplete,
          needsUserOnboarding,
          loading,
          markOnboardingComplete,
          markUserOnboardingComplete,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
      throw new Error("useAuthContext must be inside AuthProvider");
    }
    return ctx;
  }
  