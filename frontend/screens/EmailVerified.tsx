import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect,router } from 'expo-router';
import CustomButton from '@/components/CustomButton';

export default function EmailVerified() {
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const markAsComplete = async () => {
        try {
            // Clear the post-signup onboarding flag
            await AsyncStorage.removeItem('needsUserOnboarding');
            setOnboardingCompleted(true);
        } catch (error) {
            console.error('Error saving onboarding status:', error);
        }
    };
    const handleNext = () => {
      console.log("EmailVerified: Marking user onboarding as complete");
      
      
      router.push("/(collectpayment)/CollectPayment");
    };
    if (onboardingCompleted) {
        return <Redirect href="/(tabs)"/>;
    }
    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.contentWrapper}>
              <Text style={styles.title}>Your email is <Text style={{ color: '#4A3DE3', fontWeight: '600' }}>verified</Text>! 🎉</Text>
              <Text style={styles.subtitle}>You’re one step closer to managing your subscriptions with ease.</Text>
            <Image source={require('../assets/placeholderFrame.png')} style={styles.logoBox}></Image>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  contentWrapper: {
    width: 345
  },
  logoBox: {
    marginTop: 20,
    width: 345,
    height: 374,
    borderRadius: 20,
    marginBottom: 20
  },
  title: {
    fontSize: 30,
    fontWeight: 600,
    textAlign: 'left',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    marginHorizontal: 20,
    lineHeight: 28,
    marginLeft: 0,
    marginBottom: 20
  },
  nextButton: {
    backgroundColor: '#4A3DE3',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 40
  },

});