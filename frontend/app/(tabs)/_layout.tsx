import React, { useState, useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StripeProvider } from '@stripe/stripe-react-native';

export default function TabLayout() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  return (
    <StripeProvider
      publishableKey = {publishableKey || "pk_test_51RCKvhP6zmoUwvZwkocdBO2hyFBXuiUrU5upYLJZ8IQNZnSXD3TSxrMVkxgOviRuCArTK6lS1gKy8eZ6NNDND9bz00x86Xhrbv"}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4353FD",
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
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </StripeProvider>
  );
}
