import { useRef, useState, useEffect } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, Animated } from 'react-native';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Redirect } from 'expo-router';
import WelcomeScreen from './WelcomeScreen';
import CustomButton from '@/components/CustomButton';
import { router } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuth } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');

type Feature = {
  id: string;
  title?: string;
  description?: string;
  component?: JSX.Element;
};

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<Feature>>(null);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [redirectReady, setRedirectReady] = useState(false);
  const { markOnboardingComplete, onboardingComplete } = useAuthContext();
  const { isSignedIn } = useAuth();
  
  // Animated value for background color transition
  const scrollX = useRef(new Animated.Value(0)).current;
  const animatedBackgroundColor = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: ['#4A3DE3', '#FFFFFF', '#FFFFFF'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (isSignedIn) {
      markOnboardingComplete();
      setRedirectReady(true);
    }
  }, [isSignedIn]);

  const features: Feature[] = [
    { id: '1', component: <WelcomeScreen /> },
    {
      id: '2',
      title: 'Your subscriptions, all in one place.',
      description:
        "Manage all your subscriptions, both personal and shared, and keep track of what's active, upcoming, or on trial.",
    },
    {
      id: '3',
      title: 'Share subscriptions seamlessly.',
      description:
        'Start or join groups, add members, and manage shared subscriptions together. From payments to renewals, keep things in sync.',
    },
    {
      id: '4',
      title: 'Get notified and stay in control.',
      description:
        'Never miss a renewal, OTP, or group update. Smart reminders and real-time alerts keep your subscriptions running smoothly.',
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

  const handleSignUp = () => {
    router.push('/(auth)/sign-up').then(() => {
      markOnboardingComplete();
    });
  };

  const handleLogIn = () => {
    markOnboardingComplete();
    router.push('/(auth)/sign-in');
  };

  if (redirectReady || onboardingComplete) {
    return <Redirect href={isSignedIn ? '/(tabs)' : '/(welcome)'} />;
  }

  const renderItem = ({ item, index }: { item: Feature; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.pageContainer,
          { width },
          // Only fade the first two screens
          (index === 0 || index === 1) && { opacity },
        ]}
      >
        {item.component ? (
          item.component
        ) : (
          <View style={styles.contentContainer}>
            <Image
              source={require('../assets/placeholderFrame.png')}
              style={styles.imageBox}
            />
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDescription}>{item.description}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: animatedBackgroundColor },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={styles.dotsContainer}>
          {features.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentFeature ? 24 : 8,
                  backgroundColor:
                    i === currentFeature
                      ? (i === 0
                          ? scrollX.interpolate({
                              inputRange: [0, width / 2],
                              outputRange: ['#FFFFFF', '#000000'],
                              extrapolate: 'clamp',
                            })
                          : 'black')
                      : (i === 0
                          ? 'rgba(255,255,255,0.5)'
                          : '#D3D3D3'),
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

        {/* only show footer on slides 2+ */}
        {currentFeature !== 0 && (
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
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  pageContainer: { 
    flex: 1, 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left',
  },
  featureDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 30,
    textAlign: 'left',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
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
    backgroundColor: '#4A3DE3',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  signUpText: { color: 'white' },

  logInButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#4A3DE3',
  },
  logInText: { color: '#4A3DE3' },

  imageBox: {
    width: 345,
    height: 354,
    borderRadius: 20,
    marginBottom: 20,
  },
});
