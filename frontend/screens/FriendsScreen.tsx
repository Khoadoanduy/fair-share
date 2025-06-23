import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import SubscriptionCard from '../components/SubscriptionCard';


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
    totalMem: number;
    amountEach: number;
    subscription?: {
      id: string;
      name: string;
      logo: string;
      category: string;
    };
    timeAgo: string;
  };
  message: string;
  hasRequested: boolean;
  requestStatus: string | null;
}

interface UserGroup {
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
    totalMem: number;
    amountEach: number;
    subscription?: {
      id: string;
      name: string;
      logo: string;
      category: string;
    };
    timeAgo: string;
  };
  message: string;
  userRole: string;
}

export default function FriendsScreen() {
  const { userId: clerkId } = useAuth();
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'postings'>('feed');

  // Friend activity states (My feed tab)
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // User groups states (My postings tab)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // Join request loading states
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (clerkId) {
      setLoading(true);
      axios.get(`${API_URL}/api/user?clerkID=${clerkId}`)
        .then(res => {
          setMongoUserId(res.data.id);
          // Start fetching data for both tabs
          fetchData(res.data.id);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [clerkId]);

  // Auto-refresh activities every 30 seconds
  useEffect(() => {
    if (!mongoUserId) return;

    const interval = setInterval(() => {
      fetchData(mongoUserId, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [mongoUserId, activeTab]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (mongoUserId) {
        fetchData(mongoUserId, false);
      }
    }, [mongoUserId, activeTab])
  );

  const fetchData = async (userId: string, showLoading = true) => {
    if (activeTab === 'feed') {
      try {
        if (showLoading) {
          setFeedLoading(true);
          setFeedError(null);
        }
        const response = await axios.get(`${API_URL}/api/feed/subscriptions/${userId}`);
        setActivities(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching friend activities:', err);
        if (showLoading) setFeedError('Failed to load friend activities');
        setActivities([]);
      } finally {
        if (showLoading) setFeedLoading(false);
      }
    } else {
      try {
        if (showLoading) {
          setGroupsLoading(true);
          setGroupsError(null);
        }
        const response = await axios.get(`${API_URL}/api/user/groups/${userId}`);
        setUserGroups(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching user groups:', err);
        if (showLoading) setGroupsError('Failed to load your groups');
        setUserGroups([]);
      } finally {
        if (showLoading) setGroupsLoading(false);
      }
    }
  };

  const handleManualRefresh = async () => {
    if (!mongoUserId) return;
    setRefreshing(true);
    await fetchData(mongoUserId, false);
    setRefreshing(false);
  };

  const handleJoinRequest = async (groupId: string, groupName: string) => {
    if (!mongoUserId) return;

    setJoiningGroups(prev => new Set(prev).add(groupId));

    try {
      // Use the new join request endpoint
      await axios.post(`${API_URL}/api/invite/request/${groupId}/${mongoUserId}`);
      Alert.alert(
        'Request Sent!',
        `Your request to join "${groupName}" has been sent to the group leader.`,
        [{ text: 'OK' }]
      );

      // Refresh the feed to update status
      fetchData(mongoUserId, false);
    } catch (err: any) {
      console.error('Error sending join request:', err);

      let errorMessage = 'Failed to send join request. Please try again.';
      if (err.response?.status === 409) {
        errorMessage = 'You have already requested to join this group or are already a member.';
      }

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const handleDeletePosting = async (groupId: string, groupName: string) => {
    if (!mongoUserId) return;

    try {
      // Add API call to delete the group/posting
      await axios.delete(`${API_URL}/api/group/${groupId}/${mongoUserId}`);

      Alert.alert(
        'Posting Deleted',
        `"${groupName}" has been deleted successfully.`,
        [{ text: 'OK' }]
      );

      // Refresh the postings to update the list
      fetchData(mongoUserId, false);
    } catch (err: any) {
      console.error('Error deleting posting:', err);

      let errorMessage = 'Failed to delete posting. Please try again.';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this posting.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Posting not found.';
      }

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    }
  };

  const renderActivityItem = ({ item }: { item: FriendActivity }) => (
    <SubscriptionCard
      mode="feed"
      friend={item.friend}
      group={item.group}
      message={item.message}
      hasRequested={item.hasRequested}
      onJoinRequest={handleJoinRequest}
      isJoining={joiningGroups.has(item.group.id)}
    />
  );

  const renderUserGroupItem = ({ item }: { item: UserGroup }) => (
    <SubscriptionCard
      mode="postings"
      friend={item.friend}
      group={item.group}
      message={item.message}
      userRole={item.userRole}
      onDeletePosting={handleDeletePosting}
    />
  );

  const renderFeedContent = () => {
    if (feedLoading) {
      return (
        <View style={styles.feedLoadingContainer}>
          <ActivityIndicator color="#4353FD" />
          <Text style={styles.loadingText}>Loading friend activities...</Text>
        </View>
      );
    }

    if (feedError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{feedError}</Text>
        </View>
      );
    }

    if (activities.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No friend activity yet</Text>
          <Text style={styles.emptySubtext}>When your friends join new groups, you'll see them here</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={activities}
        keyExtractor={item => item.id}
        renderItem={renderActivityItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            colors={['#4353FD']}
            tintColor="#4353FD"
          />
        }
        style={styles.feedList}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  const renderPostingsContent = () => {
    if (groupsLoading) {
      return (
        <View style={styles.feedLoadingContainer}>
          <ActivityIndicator color="#4353FD" />
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </View>
      );
    }

    if (groupsError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{groupsError}</Text>
        </View>
      );
    }

    if (userGroups.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="add-circle-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Create your first group to start sharing subscriptions</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={userGroups}
        keyExtractor={item => item.id}
        renderItem={renderUserGroupItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            colors={['#4353FD']}
            tintColor="#4353FD"
          />
        }
        style={styles.feedList}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.headerTitle}>Feed</Text>
          <TouchableOpacity onPress={() => router.push('/(friends)/friend-list')}>
            <FontAwesome5 name="user-friends" size={24} color="#4353FD" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
              My feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'postings' && styles.activeTab]}
            onPress={() => setActiveTab('postings')}
          >
            <Text style={[styles.tabText, activeTab === 'postings' && styles.activeTabText]}>
              My postings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.feedLoadingContainer}>
            <ActivityIndicator color="#4353FD" />
            <Text style={styles.loadingText}>Loading user data...</Text>
          </View>
        ) : mongoUserId ? (
          activeTab === 'feed' ? renderFeedContent() : renderPostingsContent()
        ) : (
          <Text style={styles.emptyText}>Failed to load user data</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerPlaceholder: {
    width: 24, // Same width as the icon to balance the layout
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4353FD',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4353FD',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  feedLoadingContainer: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  feedList: {
    flex: 1,
  },
});