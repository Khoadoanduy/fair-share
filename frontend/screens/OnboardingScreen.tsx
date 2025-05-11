import { useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { StyleSheet, Text, View, SafeAreaView, Image, FlatList, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import WelcomeScreen from './WelcomeScreen';
import CustomButton from '@/components/CustomButton';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type Feature = {
  id: string;
  title?: string;
  description?: string;
  component?: JSX.Element;
  backgroundColor?: string;
};

export default function OnboardingScreen() {
  const flatListRef = useRef(null);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features: Feature [] = [
    {
      id: '1',
      component: <WelcomeScreen />,
      backgroundColor: '#4A3DE3'
    },
    {
      id: '2',
      title: 'Your subscriptions, all in one place.',
      description:
        "Manage all your subscriptions, both personal and shared, and keep track of what's active, upcoming, or on trial."
    },
    {
      id: '3',
      title: 'Share subscriptions seamlessly.',
      description:
        'Start or join groups, add members, and manage shared subscriptions together. From payments to renewals, keep things in sync.'
    },
    {
      id: '4',
      title: 'Get notified and stay in control.',
      description:
        'Never miss a renewal, OTP, or group update. Smart reminders and real-time alerts keep your subscriptions running smoothly.'
    }
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentFeature(index);
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  const handleLogIn = () => {
    router.push('/(auth)/sign-in');
  };

  const renderItem = ({ item }: { item: Feature }) => (
    <View style={[styles.pageContainer, { width }]}>
      {item.component ? (
        item.component
      ) : (
        <View style={styles.contentContainer}>
          <Image
            source={require('../assets/placeholderFrame.png')}
            style={styles.imageBox}
          />
          <Text style={styles.featureTitle}>
            {item.title.split(' ').map((word, index) => {
                const isHighlighted = ['one', 'notified', 'place', 'seamlessly', 'in', 'control']
                                    .includes(word.replace(/[.,]/g, ''));
                return (
                    <Text key={index}
                            style={{ color: isHighlighted ? '#4A3DE3' : 'black' }}
                    >
                        {word}{' '}
                    </Text>
                );
            })}
          </Text>
          <Text style={styles.featureDescription}>{item.description}</Text>
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
              textStyle={styles.logInText}
              onPress={handleLogIn}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: features[currentFeature].backgroundColor || '#fff'
        }
      ]}
    >
      <View style={styles.dotsContainer}>
        {features.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentFeature ? 'black' : '#D3D3D3',
                width: index === currentFeature ? 24 : 8
              }
            ]}
          />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={features}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  pageContainer: {
    flex: 1
  },
  contentContainer: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 40
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left'
  },
  featureDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 30,
    textAlign: 'left'
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    marginBottom: 10
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4
  },
  buttonContainer: {
    marginBottom: 80,
    gap: 10,
    width: 345,
    height: 90
  },
  signUpButton: {
    backgroundColor: '#4A3DE3',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  logInButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#4A3DE3',
    alignItems: 'center'
  },
  logInText: {
    color: '#4A3DE3'
  },
  signUpText: {
    color: 'white'
  },
  imageBox: {
    width: 345,
    height: 354,
    borderRadius: 20,
    marginBottom: 20,
  }
});
