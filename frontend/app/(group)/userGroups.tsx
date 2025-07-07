import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface GroupData {
  id: string;
  userId: string;
  groupId: string;
  userRole: string;
  group: {
    id: string;
    groupName: string;
    subscriptionName: string;
    planName: string;
    amount: number;
    cycle: string;
    createdAt: string;
  };
}

export default function UserGroupsScreen() {
  const { user } = useUser();
  const clerkId = user?.id;
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get MongoDB user ID from Clerk ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        if (!clerkId) return;

        const response = await axios.get(`${API_URL}/api/user/`, {
          params: { clerkID: clerkId },
        });
        setUserId(response.data.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (clerkId) {
      fetchUserId();
    }
  }, [clerkId]);

  // Fetch user's groups
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        if (!userId) return;

        const response = await axios.get(`${API_URL}/api/user/groups/${userId}`);
        console.log('User groups:', response.data);

        if (response.data.message === 'No group found') {
          setGroups([]);
        } else {
          setGroups(response.data);
        }
      } catch (error) {
        console.error('Error fetching user groups:', error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserGroups();
    }
  }, [userId]);

  const handleGroupPress = (groupId: string) => {
    router.push({
      pathname: '/(group)/subscriptionDetails',
      params: { groupId }
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRoleColor = (role: string) => {
    return role === 'leader' ? '#4A3DE3' : '#666';
  };

  const getRoleBadge = (role: string) => {
    return role === 'leader' ? '👑 Leader' : '👤 Member';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#4A3DE3" />
          <Text style={{ marginTop: 10, color: '#666' }}>Loading your groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Groups</Text>

        {groups.length > 0 ? (
          <>
            <Text style={styles.subtitle}>
              You're a member of {groups.length} group{groups.length !== 1 ? 's' : ''}
            </Text>

            <FlatList
              data={groups}
              keyExtractor={(item) => item.group.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.groupCard}
                  onPress={() => handleGroupPress(item.group.id)}
                >
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{item.group.groupName}</Text>
                    <Text style={[styles.roleBadge, { color: getRoleColor(item.userRole) }]}>
                      {getRoleBadge(item.userRole)}
                    </Text>
                  </View>

                  <Text style={styles.subscriptionName}>
                    {item.group.subscriptionName}
                  </Text>

                  <Text style={styles.planName}>
                    {item.group.planName}
                  </Text>

                  <View style={styles.groupFooter}>
                    <Text style={styles.amount}>
                      {formatAmount(item.group.amount)} / {item.group.cycle}
                    </Text>
                    <Text style={styles.tapHint}>Tap for details →</Text>
                  </View>
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't joined any groups yet</Text>
            <Text style={styles.emptySubtext}>Create your first group or accept an invitation to get started!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  groupCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
    flex: 1,
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: '600' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  subscriptionName: {
    fontSize: 16,
    color: '#4A3DE3',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  planName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  groupFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  tapHint: {
    fontSize: 12,
    color: '#4A3DE3',
    fontStyle: 'italic' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 20,
  },
};