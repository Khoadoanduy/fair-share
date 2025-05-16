import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { useAuthContext } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const { markOnboardingComplete } = useAuthContext();

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
      <View style={styles.footer}>
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
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
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