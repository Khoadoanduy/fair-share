// app/index.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuth } from '@clerk/clerk-expo';

export default function Index() {
  const { loading: contextLoading, onboardingComplete } = useAuthContext();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  console.log("onboarding status" + onboardingComplete)
  // Show spinner while auth or onboarding state is initializing
  if (contextLoading || !authLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4353FD" />
      </View>
    );
  }

  // First-time visitor: initial onboarding flow
  if (onboardingComplete==false) {
    return <Redirect href="/(onboarding)" />;
  }

  // Completed onboarding but not signed in: welcome/sign-up
  if (!isSignedIn) {
    console.log('not signed in');
    return <Redirect href="/(welcome)" />;
  }

  // Signed in and onboarded: main app tabs
  else{
    console.log('signed in');
    return <Redirect href="/(tabs)" />;
  }
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
