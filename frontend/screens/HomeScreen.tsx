import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import PaymentMethod from "@/components/PaymentMethod";
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Noti from "@/components/TestNoti";
import { usePushNotifications } from "@/components/PushNoti";

export default function HomeScreen() {
  const { user } = useUser();
  usePushNotifications();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        
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