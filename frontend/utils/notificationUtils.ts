// utils/notificationUtils.ts
import * as Notifications from 'expo-notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
        handleNotification: async () => ({
                shouldShowBanner: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowList: true,
        }),
});

export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification 📱',
        body: 'This is a simple test notification!',
        data: { test: 'data' },
      },
      trigger: null, // null = immediate notification
    });
    console.log('Test notification sent!');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};