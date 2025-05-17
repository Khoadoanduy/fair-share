// src/screens/WelcomeScreen.tsx
import { StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { useAuthContext as useAuthContextFromProvider } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const { markOnboardingComplete } = useAuthContextFromProvider();

  const handleSignUp = () => {
    markOnboardingComplete();
    router.push('/(auth)/sign-up');
  };

  const handleLogIn = () => {
    markOnboardingComplete();
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/FairShare_logo.png')}
            style={styles.logoBox}
          />
          <Text style={styles.title}>Fair Share</Text>
          <Text style={styles.subtitle}>Shared subscriptions, simplified.</Text>
        </View>
      </View>

      {/* Button group at bottom */}
      <View style={styles.buttonContainer}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A3DE3',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoBox: {
    width: 149,
    height: 149,
    backgroundColor: '#4A3DE3',
    marginBottom: 20,
    borderRadius: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FCFBFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FCFBFF',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 10,
  },
  signUpButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signUpText: {
    color: 'black',
    fontWeight: '600',
  },
  logInButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  logInText: {
    color: '#FCFBFF',
    fontWeight: '600',
  },
});

// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthContextType = {
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

  // Load flags from AsyncStorage on auth load
  useEffect(() => {
    if (!isLoaded) return;
    setLoading(true);
    (async () => {
      try {
        const storedOnboarding = await AsyncStorage.getItem('onboardingComplete');
        setOnboardingComplete(storedOnboarding === 'true');

        if (isSignedIn) {
          const storedUserOnboarding = await AsyncStorage.getItem('needsUserOnboarding');
          setNeedsUserOnboarding(
            storedUserOnboarding === null ? true : storedUserOnboarding === 'true'
          );
        } else {
          setNeedsUserOnboarding(false);
        }
      } catch (err) {
        console.error('Error loading onboarding flags:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn]);

  // Clear onboardingComplete when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      AsyncStorage.setItem('onboardingComplete', 'false')
        .catch(err => console.error('Error resetting onboarding flag:', err));
      setOnboardingComplete(false);
    }
  }, [isSignedIn]);

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
      setOnboardingComplete(true);
    } catch (err) {
      console.error('Failed to save onboardingComplete:', err);
    }
  };

  const markUserOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('needsUserOnboarding', 'false');
      setNeedsUserOnboarding(false);
    } catch (err) {
      console.error('Failed to save needsUserOnboarding:', err);
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
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
