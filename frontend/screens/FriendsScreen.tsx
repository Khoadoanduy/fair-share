import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import FriendSubscriptionFeed from '@/components/FriendSubscriptionFeed';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function FriendsScreen() {
  const { userId: clerkId } = useAuth();
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  // Change initial loading state to false so screen renders immediately
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clerkId) {
      // Only show loading indicator while fetching
      setLoading(true);
      axios.get(`${API_URL}/api/user?clerkID=${clerkId}`)
        .then(res => setMongoUserId(res.data.id))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [clerkId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* This button is always visible immediately */}
        <TouchableOpacity
          style={styles.friendsButton}
          onPress={() => router.push('/(friends)/friend-list')}
        >
          <Ionicons name="people" size={20} color="#4353FD" />
          <Text style={styles.buttonText}>View My Friends</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <Text style={styles.heading}>Friend Activity</Text>
        
        {/* Show loading indicator only for the feed section */}
        {loading ? (
          <View style={styles.feedLoading}>
            <ActivityIndicator color="#4353FD" />
            <Text style={styles.loading}>Loading activity...</Text>
          </View>
        ) : mongoUserId ? (
          <FriendSubscriptionFeed userId={mongoUserId} />
        ) : (
          <Text style={styles.emptyText}>Failed to load activity</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    flex: 1,
    padding: 15
  },
  feedLoading: {
    padding: 20,
    alignItems: 'center',
  },
  loading: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4353FD',
    flex: 1,
    marginLeft: 10
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  }
});