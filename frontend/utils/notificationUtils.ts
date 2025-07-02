import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications(userId: string) {
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    if (!userId) return;

    // Register push notifications when component mounts
    registerForPushNotificationsAsync();
  }, [userId]);

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
      await registerTokenWithBackend(userId, token);

    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const registerTokenWithBackend = async (userId: string, token: string) => {
    try {
    console.log('Registering token for user:', userId);
    console.log('Token:', token);
        const response = await axios.post(`${API_URL}/api/notifications/register`, {
                id: userId,
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