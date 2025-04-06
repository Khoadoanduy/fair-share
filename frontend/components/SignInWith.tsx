import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useEffect, useCallback } from 'react';
import { useSSO } from '@clerk/clerk-expo';
import { Pressable, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

type SignInWithProps = {
  strategy: 'oauth_google' | 'oauth_apple' | 'oauth_facebook';
};

// Map strategies to FontAwesome icon names and colors
const strategyConfig = {
  oauth_google: { name: 'google', color: '#DB4437' },
  oauth_apple: { name: 'apple', color: '#000000' },
  oauth_facebook: { name: 'facebook', color: '#4267B2' },
};

export default function SignInWith({ strategy }: SignInWithProps) {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [strategy]);

  const config = strategyConfig[strategy];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: pressed ? `${config.color}DD` : config.color },
      ]}
      onPress={onPress}
    >
      <FontAwesome name={config.name as any} size={24} color="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
});