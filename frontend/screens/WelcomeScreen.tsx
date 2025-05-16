import { StyleSheet, Text, View, Image } from 'react-native';
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
          <Image source={require('../assets/FairShare_logo.png')} style={styles.logoBox}></Image>
          <Text style={styles.title}>Fair Share</Text>
          <Text style={styles.subtitle}>Shared subscriptions, simplified.</Text>
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            text="Sign Up"
            style={styles.signUpButton}
            textStyle={styles.signUpText}
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
    fontWeight: 600,
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
    gap: 10,
    width: 345,
    height: 90,
  },
  signUpButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logInButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ffffff',
    alignItems: 'center',
  },
  signUpText: {
    color: 'black'
  }
});