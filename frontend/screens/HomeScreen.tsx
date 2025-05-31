import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, Alert, TextInput, Platform } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import PaymentMethod from "@/components/PaymentMethod";
import React, { useEffect, useState } from 'react';
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
  }
});