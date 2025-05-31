import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import axios from "axios";

const API_URL = 'http://192.168.89.64:3000';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const { user } = useUser();
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    // Register push notifications when component mounts
    registerForPushNotificationsAsync();
  }, [user?.id]);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    try {
      // Get notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      setExpoPushToken(token);

      // Register token with backend
      await registerTokenWithBackend(token);

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const registerTokenWithBackend = async (token: string) => {
    try {
    console.log('Registering token for user:', user?.id);
    console.log('Token:', token);
        const response = await axios.post(`${API_URL}/api/push-tokens/register`, {
                clerkId: user?.id,
                token: token
            })

    if (response.data.success) {
        console.log('✅ Push token registered with backend');
      } else {
        console.error('Failed to register token with backend');
      }
    } catch (error) {
      console.error('Error registering token:', error);
    }
  };

  return {
    expoPushToken,
    registerForPushNotificationsAsync,
  };
}
