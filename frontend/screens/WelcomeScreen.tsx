import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  const handleLogIn = () => {
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox} />
          <Text style={styles.title}>Fair Share</Text>
          <Text style={styles.subtitle}>Split expenses easily with friends and family</Text>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            text="Sign Up"
            style={styles.signUpButton}
            onPress={handleSignUp}
          />

          <CustomButton
            text="Log In"
            style={styles.logInButton}
            onPress={handleLogIn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    width: 120,
    height: 120,
    backgroundColor: '#F0F2F5',
    marginBottom: 20,
    borderRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  signUpButton: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  logInButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
});