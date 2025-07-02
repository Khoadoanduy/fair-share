import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  SafeAreaView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import axios from 'axios';
import { debounce } from 'lodash';
import FriendRequestButton from '@/components/FriendRequestButton';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

// Helper function to get avatar color
const getAvatarColor = (name: string) => {
  const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function FriendListScreen() {
  const { userId: clerkId } = useAuth();
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [actionLoadingIds, setActionLoadingIds] = useState<{ [key: string]: boolean }>({});
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Initialize user data
  useEffect(() => {
    if (!clerkId) return;

    const initializeData = async () => {
      try {
        setLoading(true);
        const { data: userData } = await axios.get(`${API_URL}/api/user?clerkID=${clerkId}`);

        if (userData?.id) {
          setInternalUserId(userData.id);
          await loadFriendsData(userData.id);
        }
      } catch (err) {
        console.error("Error initializing:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [clerkId]);

  // Load friends and requests data
  const loadFriendsData = async (id = internalUserId) => {
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
      if (!query?.trim() || !internalUserId) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data } = await friendApi.searchUsers(query, internalUserId);

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
    [internalUserId, friends, requests]
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setShowSearchResults(text.length > 0);
    debouncedSearch(text);
  };

  // Friend invitation management
  const handleSendInvitation = async (recipientId: string) => {
    if (!internalUserId) return;

    setActionLoadingIds(prev => ({ ...prev, [recipientId]: true }));
    setSearchResults(prev =>
      prev.map(user => user.id === recipientId ? { ...user, isPending: true } : user)
    );

    try {
      // Clean up any existing invitations
      try {
        await friendApi.removeAllInvitations(internalUserId, recipientId);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        // Continue even if cleanup fails
      }

      // Send new invitation
      await friendApi.sendInvitation(internalUserId, recipientId);
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
    if (!internalUserId) return;

    setActionLoadingIds(prev => ({ ...prev, [friendId]: true }));
    const removedFriend = friends.find(f => f.id === friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));

    try {
      await friendApi.removeFriend(internalUserId, friendId);
    } catch (error) {
      if (removedFriend) setFriends(prev => [...prev, removedFriend]);
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [friendId]: false }));
    }
  };

  // Render search bar
  const renderSearchBar = () => (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color="#666" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username"
        placeholderTextColor="#9CA3AF"
        value={search}
        onChangeText={handleSearchChange}
        returnKeyType="search"
      />
      {search.length > 0 ? (
        <TouchableOpacity onPress={() => {
          setSearch('');
          setSearchResults([]);
          setShowSearchResults(false);
        }}>
          <Ionicons name="close-circle" size={18} color="#999" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-down" size={18} color="#999" />
      )}
    </View>
  );

  // Render search results
  const renderSearchResults = () => {
    if (searching) return <ActivityIndicator style={styles.loading} color="#4A3DE3" />;

    if (searchResults.length > 0) {
      return (
        <View style={styles.searchDropdown}>
          <Text style={styles.suggestedLabel}>Suggested</Text>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.searchResultItem}>
                <View style={styles.searchResultLeft}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {item.firstName[0]}{item.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{item.firstName} {item.lastName}</Text>
                    {item.username && <Text style={styles.searchResultHandle}>@{item.username}</Text>}
                  </View>
                </View>
                <FriendRequestButton
                  senderId={internalUserId || ''}
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
        <View style={styles.searchDropdown}>
          <Text style={styles.emptyResults}>No results found</Text>
        </View>
      );
    }

    return null;
  };

  // Periodically check for new friend requests
  useEffect(() => {
    if (!internalUserId) return;

    const intervalId = setInterval(() => {
      friendApi.getFriendRequests(internalUserId)
        .then(res => {
          if (JSON.stringify(res.data) !== JSON.stringify(requests)) {
            setRequests(res.data);
          }
        })
        .catch(() => { });
    }, 30000);

    return () => clearInterval(intervalId);
  }, [internalUserId, requests]);

  return (
    <SafeAreaView style={styles.container}>
      {!clerkId ? (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#4A3DE3" />
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#4A3DE3" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Friends</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.content}>
            {/* Add friends section */}
            <View style={styles.sectionCard}>
              <Text style={styles.addFriendsTitle}>Add friends</Text>
              {renderSearchBar()}
              {renderSearchResults()}
            </View>

            {!showSearchResults && (
              <>
                {/* Your friends section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your friends</Text>
                    <Text style={styles.sectionCount}>{friends.length} friends</Text>
                  </View>

                  {friendsLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <View key={i} style={[styles.userItem, styles.skeletonItem]}>
                        <View style={styles.skeletonAvatar} />
                        <View style={styles.skeletonText} />
                      </View>
                    ))
                  ) : friends.length > 0 ? (
                    <FlatList
                      data={friends}
                      keyExtractor={item => item.id}
                      renderItem={({ item }) => (
                        <View style={styles.userItem}>
                          <View style={styles.userLeft}>
                            <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.firstName) }]}>
                              <Text style={styles.avatarText}>
                                {item.firstName[0]}{item.lastName[0]}
                              </Text>
                            </View>
                            <View style={styles.userInfo}>
                              <Text style={styles.userName}>
                                {item.firstName} {item.lastName}
                              </Text>
                              {item.username && (
                                <Text style={styles.userHandle}>{item.username}</Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveFriend(item.id)}
                            disabled={actionLoadingIds[item.id]}
                          >
                            {actionLoadingIds[item.id] ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="person-remove" size={18} color="white" />
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={styles.emptyText}>No friends yet</Text>
                  )}
                </View>

                {/* Requests section */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Requests</Text>
                    <Text style={styles.sectionCount}>{requests.length} requests</Text>
                  </View>

                  {requestsLoading ? (
                    Array(2).fill(0).map((_, i) => (
                      <View key={i} style={[styles.userItem, styles.skeletonItem]}>
                        <View style={styles.skeletonAvatar} />
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
                          <View style={styles.userLeft}>
                            <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.sender.firstName) }]}>
                              <Text style={styles.avatarText}>
                                {item.sender.firstName[0]}{item.sender.lastName[0]}
                              </Text>
                            </View>
                            <View style={styles.userInfo}>
                              <Text style={styles.userName}>
                                {item.sender.firstName} {item.sender.lastName}
                              </Text>
                              {item.sender.username && (
                                <Text style={styles.userHandle}>{item.sender.username}</Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.requestButtons}>
                            <TouchableOpacity
                              style={styles.declineButton}
                              onPress={() => handleDecline(item.id)}
                              disabled={actionLoadingIds[item.id]}
                            >
                              {actionLoadingIds[item.id] ? (
                                <ActivityIndicator size="small" color="#667085" />
                              ) : (
                                <Text style={styles.declineText}>Decline</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.acceptButton}
                              onPress={() => handleAccept(item.id)}
                              disabled={actionLoadingIds[item.id]}
                            >
                              {actionLoadingIds[item.id] ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.acceptText}>Accept</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={styles.emptyText}>No requests</Text>
                  )}
                </View>
              </>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A3DE3',
  },
  headerPlaceholder: {
    width: 34,
  },

  content: {
    flex: 1,
    padding: 16
  },

  // Section card styles
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  sectionHeader: {
    marginBottom: 16,
  },

  // Add friends section
  addFriendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937'
  },
  loading: { marginTop: 20 },
  searchDropdown: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  suggestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A3DE3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  searchResultHandle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userInfo: {
    marginLeft: 12,
  },

  userName: { fontWeight: '500', fontSize: 16 },
  userHandle: { fontSize: 14, color: '#777', marginTop: 2 },
  emptyResults: { textAlign: 'center', padding: 15, color: '#777' },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 0,
  },

  removeButton: { 
    backgroundColor: '#4A3DE3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 36,
  },

  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

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
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  skeletonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
  },

  requestButtons: { flexDirection: 'row', gap: 8 },
  declineButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  declineText: { color: '#4A3DE3', fontWeight: '500' },

  acceptButton: {
    backgroundColor: '#4A3DE3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  acceptText: { color: '#FFFFFF', fontWeight: '500' },
});