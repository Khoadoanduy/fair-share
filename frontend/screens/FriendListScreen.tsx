import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  SafeAreaView, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { debounce } from 'lodash';
import FriendRequestButton from '@/components/FriendRequestButton';

// Constants
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  username?: string;
}

interface Friend extends User { }

interface FriendRequest {
  id: string;
  sender: User;
  recipient: User;
  status: string;
}

interface SearchResult extends User {
  isFriend?: boolean;
  isPending?: boolean;
}

// API service
const friendApi = {
  getFriends: (userId: string) =>
    axios.get(`${API_URL}/api/friend/${userId}`),

  getFriendRequests: (userId: string) =>
    axios.get(`${API_URL}/api/friend/invitation/${userId}?type=received`),

  searchUsers: (query: string, userId: string) =>
    axios.get(`${API_URL}/api/friend/search/${query}?userId=${userId}`),

  sendInvitation: (senderId: string, recipientId: string) =>
    axios.post(`${API_URL}/api/friend/invitation`, { senderId, recipientId }),

  updateInvitationStatus: (id: string, status: 'accepted' | 'declined') =>
    axios.put(`${API_URL}/api/friend/invitation/${id}`, { status }),

  removeAllInvitations: (userA: string, userB: string) =>
    axios.post(`${API_URL}/api/friend/invitation/removeAll`, { userA, userB }),

  removeFriend: (userId: string, friendId: string) =>
    axios.delete(`${API_URL}/api/friend/${userId}/${friendId}`)
};

export default function FriendListScreen() {
  // State
  const { userId: clerkId } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingIds, setActionLoadingIds] = useState<{ [key: string]: boolean }>({});
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const prevClerkIdRef = useRef<string | null>(null);

  // Initialize user data
  useEffect(() => {
    if (!clerkId) return;

    const initializeData = async () => {
      try {
        setLoading(true);
        const { data: userData } = await axios.get(`${API_URL}/api/user?clerkID=${clerkId}`);

        setUserId(userData.id);
        await loadFriendsData(userData.id);
      } catch (err) {
        console.error("Error initializing:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [clerkId]);

  // Load friends and requests data
  const loadFriendsData = async (id = userId) => {
    if (!id) return;

    // Load friends with caching
    setFriendsLoading(true);
    try {
      const { data: friendsData } = await friendApi.getFriends(id);
      setFriends(friendsData);
    } catch (err) {
      setFriends([]); // No cached fallback
    } finally {
      setFriendsLoading(false);
    }

    // Load requests (no caching)
    setRequestsLoading(true);
    try {
      const { data: requestsData } = await friendApi.getFriendRequests(id);
      setRequests(requestsData);
    } catch (err) {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }

    if (search) handleSearchChange(search);
  };

  // Search functionality
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query?.trim() || !userId) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data } = await friendApi.searchUsers(query, userId);

        const resultsWithStatus = data.map((user: User) => ({
          ...user,
          isFriend: friends.some(friend => friend.id === user.id),
          isPending: requests.some(req =>
            req.sender.id === user.id || req.recipient?.id === user.id
          )
        }));

        setSearchResults(resultsWithStatus);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    [userId, friends, requests]
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  // Friend invitation management
  const handleSendInvitation = async (recipientId: string) => {
    if (!userId) return;

    setActionLoadingIds(prev => ({ ...prev, [recipientId]: true }));
    setSearchResults(prev =>
      prev.map(user => user.id === recipientId ? { ...user, isPending: true } : user)
    );

    try {
      // Clean up any existing invitations
      try {
        await friendApi.removeAllInvitations(userId, recipientId);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        // Continue even if cleanup fails
      }

      // Send new invitation
      await friendApi.sendInvitation(userId, recipientId);
    } catch (error) {
      // Only revert UI status if needed
      if (!axios.isAxiosError(error) ||
        error.response?.status !== 400 ||
        !error.response?.data?.error?.includes('already exists')) {
        setSearchResults(prev =>
          prev.map(user => user.id === recipientId ? { ...user, isPending: false } : user)
        );
      }
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [recipientId]: false }));
    }
  };

  const handleAccept = async (id: string) => {
    try {
      setActionLoadingIds(prev => ({ ...prev, [id]: true }));
      await friendApi.updateInvitationStatus(id, 'accepted');

      // Update UI optimistically
      const request = requests.find(req => req.id === id);
      if (request) {
        setRequests(prev => prev.filter(req => req.id !== id));
        const updatedFriends = [...friends, request.sender];
        setFriends(updatedFriends);
      }
    } catch (error) {
      await loadFriendsData();
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDecline = async (id: string) => {
    try {
      setActionLoadingIds(prev => ({ ...prev, [id]: true }));
      const requestToDecline = requests.find(req => req.id === id);

      if (requestToDecline) {
        try {
          await friendApi.updateInvitationStatus(id, 'declined');
          await friendApi.removeAllInvitations(
            requestToDecline.sender.id,
            requestToDecline.recipient.id
          );
        } catch (error) {
          // Failure is acceptable since we'll remove from UI anyway
        }
      }

      setRequests(prev => prev.filter(req => req.id !== id));
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!userId) return;

    setActionLoadingIds(prev => ({ ...prev, [friendId]: true }));
    const removedFriend = friends.find(f => f.id === friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));

    try {
      await friendApi.removeFriend(userId, friendId);
    } catch (error) {
      if (removedFriend) setFriends(prev => [...prev, removedFriend]);
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [friendId]: false }));
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendsData();
    setRefreshing(false);
  };

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color="#666" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        value={search}
        onChangeText={handleSearchChange}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => { setSearch(''); setSearchResults([]); }}>
          <Ionicons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Render search results
  const renderSearchResults = () => {
    if (searching) return <ActivityIndicator style={styles.loading} color="#4A3DE3" />;

    if (searchResults.length > 0) {
      return (
        <View style={styles.resultsCard}>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <View>
                  <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                  {item.username && <Text style={styles.userHandle}>{item.username}</Text>}
                </View>
                <FriendRequestButton
                  senderId={userId || ''}
                  recipientId={item.id}
                  item={item}
                  actionLoadingIds={actionLoadingIds}
                  handleSendInvitation={handleSendInvitation}
                  onRequestSent={loadFriendsData}
                />
              </View>
            )}
          />
        </View>
      );
    }

    if (search) {
      return (
        <View style={styles.resultsCard}>
          <Text style={styles.emptyResults}>No results found</Text>
        </View>
      );
    }

    return null;
  };

  // Render friend requests
  const renderFriendRequests = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Friend Requests</Text>

      {requestsLoading ? (
        Array(2).fill(0).map((_, i) => (
          <View key={i} style={[styles.userItem, styles.skeletonItem]}>
            <View style={styles.skeletonText} />
            <View style={styles.skeletonButton} />
          </View>
        ))
      ) : requests.length > 0 ? (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View>
                <Text style={styles.userName}>
                  {item.sender.firstName} {item.sender.lastName}
                </Text>
                {item.sender.username && (
                  <Text style={styles.userHandle}>{item.sender.username}</Text>
                )}
              </View>
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDecline(item.id)}
                  disabled={actionLoadingIds[item.id]}
                >
                  {actionLoadingIds[item.id] ? (
                    <ActivityIndicator size="small" color="#FF4B55" />
                  ) : (
                    <Text style={styles.declineText}>Decline</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() => handleAccept(item.id)}
                  disabled={actionLoadingIds[item.id]}
                >
                  {actionLoadingIds[item.id] ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.inviteText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyResults}>No friend requests</Text>
      )}
    </View>
  );

  // Render friends list
  const renderFriendsList = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>My Friends</Text>

      {friendsLoading ? (
        Array(3).fill(0).map((_, i) => (
          <View key={i} style={[styles.userItem, styles.skeletonItem]}>
            <View style={styles.skeletonText} />
            <View style={styles.skeletonCircle} />
          </View>
        ))
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <View>
                <Text style={styles.userName}>
                  {item.firstName} {item.lastName}
                </Text>
                {item.username && (
                  <Text style={styles.userHandle}>{item.username}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFriend(item.id)}
                disabled={actionLoadingIds[item.id]}
                style={styles.removeButton}
              >
                {actionLoadingIds[item.id] ? (
                  <ActivityIndicator size="small" color="#FF4B55" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#FF4B55" />
                )}
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4A3DE3']}
            />
          }
        />
      ) : (
        <Text style={styles.emptyResults}>No friends yet</Text>
      )}
    </View>
  );

  // Periodically check for new friend requests
  useEffect(() => {
    if (!userId) return;

    const intervalId = setInterval(() => {
      friendApi.getFriendRequests(userId)
        .then(res => {
          if (JSON.stringify(res.data) !== JSON.stringify(requests)) {
            setRequests(res.data);
          }
        })
        .catch(() => { });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [userId, requests]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add friends</Text>
        <Text style={styles.subtitle}>Send friend requests to connect with others</Text>

        {renderSearchBar()}
        {renderSearchResults()}

        {!search && (
          <>
            {renderFriendRequests()}
            {renderFriendsList()}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4A3DE3',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  loading: { marginTop: 20 },
  resultsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userName: { fontWeight: '500', fontSize: 16 },
  userHandle: { fontSize: 14, color: '#777', marginTop: 2 },
  emptyResults: { textAlign: 'center', padding: 15, color: '#777' },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15,
    paddingBottom: 10,
    color: '#333',
  },
  removeButton: { padding: 10 },
  skeletonItem: { opacity: 0.7 },
  skeletonText: {
    width: 120,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  skeletonButton: {
    width: 80,
    height: 30,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
  },
  skeletonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
  },
  requestButtons: { flexDirection: 'row', gap: 8 },
  declineButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  declineText: { color: '#FF4B55', fontWeight: '500' },
  inviteButton: {
    backgroundColor: '#4A3DE3',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  inviteText: { color: '#FFFFFF', fontWeight: '500' },
});