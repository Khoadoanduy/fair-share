import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FeedCard from '../components/FeedCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserState } from '@/hooks/useUserState';
import { useAppDispatch } from '@/redux/hooks';
import { fetchUserData } from '@/redux/slices/userSlice';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface BaseGroup {
  id: string;
  groupName: string;
  subscriptionName: string;
  amount: number;
  cycleDays: number;
  category: string;
  totalMem: number;
  maxMember: number;
  amountEach: number;
  subscription?: {
    id: string;
    name: string;
    logo: string;
    category: string;
  };
  timeAgo: string;
}

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
}

interface FriendActivity {
  id: string;
  friend: Friend;
  group: BaseGroup;
  message: string;
  hasRequested: boolean;
  requestStatus: string | null;
}

interface UserGroup extends BaseGroup {
  message: string;
  userRole: string;
  memberId: string;
}

export default function FriendsScreen() {
  const { userId: clerkId } = useAuth();
  const dispatch = useAppDispatch();
  const { userId: mongoUserId, loading: userLoading, name: userName } = useUserState();
  const [activeTab, setActiveTab] = useState<'feed' | 'postings'>('feed');

  // Combined state for both tabs
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState({ feed: true, postings: false });
  const [error, setError] = useState({ feed: null as string | null, postings: null as string | null });
  const [refreshing, setRefreshing] = useState(false);
  const [hiddenPostings, setHiddenPostings] = useState<Set<string>>(new Set());
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set());

  // AsyncStorage operations
  const manageHiddenPostings = {
    load: async () => {
      try {
        const hiddenIds = await AsyncStorage.getItem(`hiddenPostings_${clerkId}`);
        if (hiddenIds) setHiddenPostings(new Set(JSON.parse(hiddenIds)));
      } catch (error) {
        console.error('Error loading hidden postings:', error);
      }
    },
    save: async (hiddenIds: Set<string>) => {
      try {
        await AsyncStorage.setItem(`hiddenPostings_${clerkId}`, JSON.stringify([...hiddenIds]));
      } catch (error) {
        console.error('Error saving hidden postings:', error);
      }
    }
  };

  useEffect(() => {
    if (clerkId) {
      // Load hidden postings from storage first
      manageHiddenPostings.load();
      // Fetch user data through Redux
      dispatch(fetchUserData(clerkId));
    }
  }, [clerkId, dispatch]);

  // Fetch data when mongoUserId becomes available
  useEffect(() => {
    if (mongoUserId) {
      fetchData(mongoUserId);
    }
  }, [mongoUserId]);

  // Auto-refresh activities every 30 seconds for active tab only
  useEffect(() => {
    if (!mongoUserId) return;

    const interval = setInterval(() => {
      fetchData(mongoUserId, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [mongoUserId]);

  // Refresh when screen comes into focus or tab changes
  useFocusEffect(
    useCallback(() => {
      if (mongoUserId) {
        fetchData(mongoUserId, false);
      }
    }, [mongoUserId])
  );

  // Refresh when tab changes
  useEffect(() => {
    if (mongoUserId) {
      fetchData(mongoUserId, true);
    }
  }, [activeTab, mongoUserId]);

  const fetchData = useCallback(async (userId: string, showLoading = true) => {
    const tabKey = activeTab === 'feed' ? 'feed' : 'postings';

    try {
      if (showLoading) {
        setLoading(prev => ({ ...prev, [tabKey]: true }));
        setError(prev => ({ ...prev, [tabKey]: null }));
      }

      if (activeTab === 'feed') {
        const response = await axios.get(`${API_URL}/api/feed/subscriptions/${userId}`);
        const allActivities = Array.isArray(response.data) ? response.data : [];
        // Filter out full groups - only show groups with available slots
        const availableActivities = allActivities.filter((activity: FriendActivity) => 
          activity.group.totalMem < activity.group.maxMember
        );
        setActivities(availableActivities);      } else {
        const response = await axios.get(`${API_URL}/api/user/groups/${userId}`);
        const allGroups = Array.isArray(response.data) ? response.data : [];
        // Filter out hidden postings
        const visibleGroups = allGroups.filter((group: UserGroup) => !hiddenPostings.has(group.id));
        setUserGroups(visibleGroups);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab} data:`, err);
      if (showLoading) {
        const errorMessage = activeTab === 'feed'
          ? 'Failed to load friend activities'
          : 'Failed to load your groups';
        setError(prev => ({ ...prev, [tabKey]: errorMessage }));
      }
      if (activeTab === 'feed') {
        setActivities([]);
      } else {
        setUserGroups([]);
      }
    } finally {
      if (showLoading) {
        setLoading(prev => ({ ...prev, [tabKey]: false }));
      }
    }
  }, [activeTab, hiddenPostings]);

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

      // Update local state immediately
      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.group.id === groupId
            ? { ...activity, hasRequested: true, requestStatus: 'pending' }
            : activity
        )
      );

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

    // Add to hidden postings and save to storage
    const newHiddenPostings = new Set(hiddenPostings).add(groupId);
    setHiddenPostings(newHiddenPostings);
    await manageHiddenPostings.save(newHiddenPostings);

    // Remove the posting from local state immediately
    setUserGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));

    Alert.alert(
      'Posting Removed',
      `"${groupName}" has been removed from your postings. The group still exists and other members are not affected.`,
      [{ text: 'OK' }]
    );
  };

  const renderActivityItem = ({ item }: { item: FriendActivity }) => (
    <FeedCard
      mode="feed"
      friend={item.friend}
      group={item.group}
      message={item.message}
      hasRequested={item.hasRequested}
      onJoinRequest={handleJoinRequest}
      isJoining={joiningGroups.has(item.group.id)}
    />
  );

  const renderUserGroupItem = ({ item }: { item: UserGroup }) => {
    // Parse user's name for display
    const [firstName = 'You', ...lastNameParts] = userName?.split(' ') || [];
    const lastName = lastNameParts.join(' ');

    return (
      <FeedCard
        mode="postings"
        friend={{ id: mongoUserId || 'user', firstName, lastName }}
        group={item}
        message={item.message}
        userRole={item.userRole}
        onDeletePosting={handleDeletePosting}
      />
    );
  };

  // Reusable render functions
  const renderLoadingState = (message: string) => (
    <View style={styles.feedLoadingContainer}>
      <ActivityIndicator color="#4A3DE3" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );

  const renderErrorState = (error: string) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  const renderEmptyState = (icon: string, title: string, subtitle: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon as any} size={48} color="#ccc" />
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
    </View>
  );

  const renderList = (data: any[], renderItem: any) => (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleManualRefresh}
          colors={['#4A3DE3']}
          tintColor="#4A3DE3"
        />
      }
      style={styles.feedList}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );

  const renderFeedContent = () => {
    if (loading.feed) return renderLoadingState('Loading friend activities...');
    if (error.feed) return renderErrorState(error.feed);
    if (activities.length === 0) {
      return renderEmptyState(
        'people-outline',
        'No friend activity yet',
        'When your friends join new groups, you\'ll see them here'
      );
    }

    return renderList(activities, renderActivityItem);
  };

  const renderPostingsContent = () => {
    if (loading.postings) return renderLoadingState('Loading your groups...');
    if (error.postings) return renderErrorState(error.postings);
    if (userGroups.length === 0) {
      return renderEmptyState(
        'add-circle-outline',
        'No groups yet',
        'Create your first group to start sharing subscriptions'
      );
    }

    return renderList(userGroups, renderUserGroupItem);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.headerTitle}>Feed</Text>
          <TouchableOpacity onPress={() => router.push('/(friends)/friend-list')}>
            <FontAwesome5 name="user-friends" size={24} color="#4A3DE3" />
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
        {userLoading ? (
          renderLoadingState('Loading user data...')
        ) : mongoUserId ? (
          activeTab === 'feed' ? renderFeedContent() : renderPostingsContent()
        ) : (
          renderErrorState('Failed to load user data')
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
    color: '#4A3DE3',
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
    backgroundColor: '#4A3DE3',
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