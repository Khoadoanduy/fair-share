import React, { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Octicons, Feather } from "@expo/vector-icons";
import { StripeProvider } from '@stripe/stripe-react-native';

export default function TabLayout() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_51RHyoO05UULTmGntA6FTExtkuBE6cXD0X9SX9GsxUEcjzjQXOW0IWQkroU5emAbnOLvgJM47XHBznPQZo4cc7wUE00NX5dJR6D";

  if (!publishableKey) {
    throw new Error('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#4A3DE3",
          tabBarInactiveTintColor: "#888",
          // Remove back button from all tab screens
          headerLeft: () => null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Manage",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="piggy-bank-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: "Feed",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="menu-outline" size={size * 1.2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Octicons name="history" size={size*0.8} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />

      </Tabs>
    </StripeProvider>
  );
}