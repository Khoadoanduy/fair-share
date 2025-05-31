// app/index.tsx
import React, {use, useEffect} from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { SignedIn, useAuth, useUser } from '@clerk/clerk-expo';
import { useUserState } from '@/hooks/useUserState';
export default function Index() {
  const { isSignedIn,onboardingComplete } = useUserState();
  if (isSignedIn){
    return <Redirect href="/(tabs)" />;
  }
  if (onboardingComplete==false && !isSignedIn) {
    return <Redirect href="/(onboarding)" />;
  }
  if(onboardingComplete && isSignedIn){
    return <Redirect href="/(onboarding)/user" />;
  }
  if (onboardingComplete && !isSignedIn) {
    console.log("from main index.tsx to welcome")
    return <Redirect href="/(welcome)" />;
  }
  
  else{
    console.log("from main index.tsx to tabs")
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
