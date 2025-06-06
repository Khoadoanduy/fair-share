import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface FriendActivity {
  id: string;
  friend: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  group: {
    id: string;
    groupName: string;
    subscriptionName: string;
    amount: number;
    cycleDays: number;
    category: string;
  };
  message: string;
}

// Get initials from name
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

// Generate avatar color based on user ID
const getAvatarColor = (userId: string) => {
  const colors = ['#FF5733', '#33A8FF', '#9333FF', '#33FF57', '#FF33F5', '#33FFF5'];
  const index = userId.charCodeAt(0) % colors.length;
  return colors[index];
};

// Convert cycle days to readable format
const formatCycle = (cycleDays: number) => {
  if (cycleDays === 30 || cycleDays === 31) return 'monthly';
  if (cycleDays === 365) return 'yearly';
  if (cycleDays === 7) return 'weekly';
  return `${cycleDays} days`;
};

interface Props {
  userId: string;
}

const FriendSubscriptionFeed = ({ userId }: Props) => {
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFriendActivities();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchFriendActivitiesQuietly();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFriendActivitiesQuietly();
    }, [userId])
  );

  const fetchFriendActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/feed/subscriptions/${userId}`);

      if (Array.isArray(response.data)) {
        setActivities(response.data);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching friend activities:', err);
      setError('Failed to load friend activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Quiet refresh without showing loading spinner
  const fetchFriendActivitiesQuietly = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/feed/subscriptions/${userId}`);

      if (Array.isArray(response.data)) {
        setActivities(response.data);
      }
    } catch (err) {
      console.error('Error quietly fetching activities:', err);
      // Don't update error state for quiet refreshes
    }
  };

  // Manual refresh for pull-to-refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/api/feed/subscriptions/${userId}`);

      if (Array.isArray(response.data)) {
        setActivities(response.data);
      }
    } catch (err) {
      console.error('Error refreshing activities:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#4353FD" />
        <Text style={styles.loadingText}>Loading friend activities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activities.length === 0 ? (
        <Text style={styles.emptyText}>No friend activity yet</Text>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.friend.id) }]}>
                  <Text style={styles.initials}>
                    {getInitials(item.friend.firstName, item.friend.lastName)}
                  </Text>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.name}>
                    {item.friend.firstName} {item.friend.lastName}
                  </Text>
                  <Text style={styles.username}>
                    @{item.friend.username || item.friend.firstName.toLowerCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.activity}>
                joined <Text style={styles.highlight}>{item.group.subscriptionName}</Text> in group{' '}
                <Text style={styles.highlight}>{item.group.groupName}</Text>
              </Text>

              <View style={styles.footer}>
                <View style={styles.subscriptionInfo}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>{formatCycle(item.group.cycleDays)}</Text>
                </View>
                <View style={styles.subscriptionInfo}>
                  <Ionicons name="cash-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>${item.group.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.subscriptionInfo}>
                  <Ionicons name="pricetag-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>{item.group.category}</Text>
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              colors={['#4353FD']}
              tintColor="#4353FD"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: '#666',
    fontSize: 13,
  },
  activity: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  highlight: {
    fontWeight: '600',
    color: '#4353FD',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
});

export default FriendSubscriptionFeed;