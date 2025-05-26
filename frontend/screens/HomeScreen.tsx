import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import PaymentMethod from "@/components/PaymentMethod";
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Noti from "@/components/TestNoti";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Function to send push notification via Expo's service
async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification result:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export default function HomeScreen() {
  const { user } = useUser();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('Expo Push Token:', token);
      }
    });

    // Listen for notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('📬 Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User tapped notification:', response);
      const data = response.notification.request.content.data;
      
      // Handle navigation based on notification data
      Alert.alert(
        'Notification Tapped',
        `Title: ${response.notification.request.content.title}\nData: ${JSON.stringify(data)}`,
        [{ text: 'OK' }]
      );
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    return token;
  }

  const sendTestPushNotification = async () => {
    if (!expoPushToken) {
      Alert.alert('No Token', 'Push token not available yet. Please wait or restart the app.');
      return;
    }

    try {
      await sendPushNotification(
        expoPushToken,
        '🚀 Fair Share Notification',
        'This is a test push notification!',
        { 
          type: 'test',
          userId: user?.id,
          timestamp: new Date().toISOString()
        }
      );
      
      Alert.alert('Success', 'Push notification sent! You should receive it shortly.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send push notification');
    }
  };

  const sendLocalNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📱 Local Notification",
        body: 'This is a local notification (not push)',
        data: { type: 'local' },
      },
      trigger: null,
    });
  };

  const copyTokenToClipboard = () => {
    // In a real app, you'd use expo-clipboard here
    Alert.alert('Token', expoPushToken, [
      { text: 'OK' },
      { 
        text: 'Copy', 
        onPress: () => console.log('Token:', expoPushToken)
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Noti />
        
        {/* Push Notification Section */}
        <View style={styles.notificationSection}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          {Device.isDevice ? (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.pushButton]}
                onPress={sendTestPushNotification}
              >
                <Text style={styles.buttonText}>📤 Send Push Notification</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.localButton]}
                onPress={sendLocalNotification}
              >
                <Text style={styles.buttonText}>📱 Send Local Notification</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.tokenButton]}
                onPress={() => setTokenVisible(!tokenVisible)}
              >
                <Text style={styles.buttonText}>🔑 {tokenVisible ? 'Hide' : 'Show'} Push Token</Text>
              </TouchableOpacity>

              {tokenVisible && expoPushToken && (
                <TouchableOpacity 
                  style={styles.tokenContainer}
                  onPress={copyTokenToClipboard}
                >
                  <Text style={styles.tokenLabel}>Tap to copy token:</Text>
                  <Text style={styles.tokenText}>{expoPushToken}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Push notifications require a physical device
              </Text>
              <Text style={styles.warningSubtext}>
                Use Expo Go app on your phone to test
              </Text>
            </View>
          )}
        </View>

        {/* Last notification display */}
        {notification && (
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>Last Notification:</Text>
            <Text style={styles.notificationText}>
              {notification.request.content.title}
            </Text>
            <Text style={styles.notificationBody}>
              {notification.request.content.body}
            </Text>
          </View>
        )}
        
        <PaymentMethod/>
        
        {user ? (
          <>
            <Image
              source={{ uri: user?.imageUrl }}
              style={styles.profileImage}
            />
            <Text style={styles.welcomeText}>
              Welcome,{" "}
              {user?.fullName || `${user?.firstName} ${user?.lastName}`}
            </Text>
            <Text style={styles.subtitle}>
              What would you like to do today?
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.welcomeText}>Welcome to Fair Share</Text>
            <Text style={styles.subtitle}>
              The easiest way to split expenses with friends and family
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  profileImage: {
    height: 100,
    aspectRatio: 1,
    borderRadius: 100,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  notificationSection: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  pushButton: {
    backgroundColor: '#007AFF',
  },
  localButton: {
    backgroundColor: '#34C759',
  },
  tokenButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tokenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
  },
  notificationInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: 5,
  },
  notificationText: {
    fontSize: 15,
    fontWeight: '500',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    textAlign: 'center',
  },
  warningSubtext: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginTop: 5,
  },
});