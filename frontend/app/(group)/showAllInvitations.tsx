import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/BackButton';
import { Ionicons } from '@expo/vector-icons';
import AcceptInvitationButton from '@/components/AcceptInvitationButton';
import DeclineInvitationButton from '@/components/DeclineInvitationButton';
import SubscriptionCard from '@/components/SubscriptionCard';

interface Subscription {
  id: string;
  name: string;
  logo: string;
  category: string;
}

interface Group {
  id: string;
  groupName: string;
  subscriptionName: string;
  cycle: string;
  category: string;
  subscription?: Subscription;
}

interface Invitation {
  id: string;
  groupName: string;
  group: Group;
  createdAt: string;
}

interface Leader {
  firstName: string;
  lastName: string;
}

export default function AllInvitations() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id;
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sentRequests, setSentRequests] = useState<Invitation[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<{ [key: string]: string }>({});
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [leaders, setLeaders] = useState<{ [key: string]: Leader }>({}); // To store group leaders data

  const handleCreateGroup = () => {
    router.push("/(group)/createGroupName");
  };

  const mySubscriptionsRoute = () => {
    router.push("/(tabs)/groups");
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
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

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/user/invitation/${userId}`);
        setInvitations(response.data || []);
      } catch (error) {
        console.log('Error fetching invitations:', error);
      }
    };

    const fetchSentRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/user/requests-sent/${userId}`);
        setSentRequests(response.data || []);
      } catch (error) {
        console.log('Error fetching sent requests:', error);
      }
    };

    if (userId) {
      fetchInvitations();
      fetchSentRequests();
    }
  }, [userId]);

  // Fetch leaders for all groups
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const leaderData: { [key: string]: Leader } = {};

        // Fetch leader info for each group
        for (let invite of invitations) {
          const groupId = invite.group.id;
          const response = await axios.get(`${API_URL}/api/group/leader/${groupId}`);
          leaderData[groupId] = response.data; // Store leader data by groupId
        }

        setLeaders(leaderData);
      } catch (error) {
        console.error('Error fetching group leaders:', error);
      }
    };

    if (invitations.length > 0) {
      fetchLeaders();
    }
  }, [invitations]);

  const handleInvitationResponse = (groupId: string, status: 'accepted' | 'declined') => {
    setResponseStatus(prev => ({
      ...prev,
      [groupId]: status
    }));
  };

  const handleCancelRequest = async (groupId: string) => {
    try {
      await axios.delete(`${API_URL}/api/invite/cancel/${groupId}/${userId}`);
      // Remove the cancelled request from the state
      setSentRequests(prev => prev.filter(request => request.group.id !== groupId));
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  // Filter data based on selected filter
  const getFilteredData = () => {
    switch (selectedFilter) {
      case "Invitations":
        return { invitations, requests: [] };
      case "Requested":
        return { invitations: [], requests: sentRequests };
      default: // "All"
        return { invitations, requests: sentRequests };
    }
  };

  const { invitations: filteredInvitations, requests: filteredRequests } = getFilteredData();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton></BackButton>
        <Text style={styles.headerTitle}>Manage Subscriptions</Text>
        <Ionicons name="search" size={20} color="#4A3DE3" />
      </View>
      <View style={styles.toggleContainer}>
        <Pressable style={styles.toggleBtnInactive} onPress={mySubscriptionsRoute}>
          <Text style={styles.toggleTextInactive}>My Subscriptions</Text>
        </Pressable>
        <Pressable style={styles.toggleBtnActive}>
          <Text style={styles.toggleTextActive}>Pending</Text>
        </Pressable>
      </View>
      <View style={styles.filterContainer}>
        {["All", "Invitations", "Requested"].map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Invitations Section */}
      {(selectedFilter === "All" || selectedFilter === "Invitations") && (
        <>
          <Text style={styles.subtitle}>Invitations</Text>
          <Text style={styles.normal}>Review and respond to group invitations</Text>
          {filteredInvitations.length > 0 ? (
            filteredInvitations.map((invite, index) => {
              const groupId = invite.group.id;
              const groupLeader = leaders[groupId]
                ? `${leaders[groupId].firstName} ${leaders[groupId].lastName}`
                : 'Unknown Leader';
              const status = responseStatus[groupId];
              const isDisabled = status === 'accepted' || status === 'declined';

          return (
            <View key={index} style={styles.card}>
              <Text style={styles.text}>
                {groupLeader} has invited you to join {invite.groupName}!
              </Text>
              <SubscriptionCard
                logo={{ uri: invite.group.subscription?.logo }}
                subscriptionName={invite.group.subscriptionName}
                cycle={invite.group.cycle}
                isShared={true}
                category={invite.group.category}
              />
              <View style={styles.buttonContainer}>
                {status !== 'declined' && (
                  <AcceptInvitationButton
                    userId={userId!}
                    groupId={groupId}
                    disabled={status !== undefined}
                    onResponse={() => handleInvitationResponse(groupId, 'accepted')}
                  />
                )}

                    {status !== 'accepted' && (
                      <DeclineInvitationButton
                        userId={userId!}
                        groupId={groupId}
                        onResponse={() => handleInvitationResponse(groupId, 'declined')}
                      />
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No invitations found.</Text>
          )}
        </>
      )}

      {/* Requested Section */}
      {(selectedFilter === "All" || selectedFilter === "Requested") && filteredRequests.length > 0 && (
        <>
          <Text style={styles.subtitle}>Requested</Text>
          <Text style={styles.normal}>Track groups you requested to join</Text>
          {filteredRequests.map((request, index) => {
            const timeAgo = new Date(request.createdAt).toLocaleString();
            return (
              <View key={index} style={styles.card}>
                <Text style={styles.text}>
                  You requested to join {request.group.groupName}.
                </Text>
                <Text style={styles.timeText}>{timeAgo}</Text>
                <Text style={styles.senderText}>{user?.firstName} {user?.lastName}</Text>
                <SubscriptionCard
                  logo={{ uri: request.group.subscription?.logo }}
                  subscriptionName={request.group.subscriptionName}
                  cycle={request.group.cycle}
                  isShared={true}
                  category={request.group.category}
                />
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Waiting for approval</Text>
                  <Pressable onPress={() => handleCancelRequest(request.group.id)}>
                    <Text style={styles.cancelText}>Cancel Request</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </>
      )}
      <Pressable style={styles.fab} onPress={handleCreateGroup}>
        <Ionicons name="add" size={24} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginTop: -60
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A3DE3",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1E1E',
    marginHorizontal: 20,
    marginTop: 10,
  },
  normal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
    backgroundColor: "#4A3DE31A",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  toggleBtnActive: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    alignContent: "center",
    justifyContent: "center"
  },
  toggleBtnInactive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignContent: "center",
  },
  toggleTextActive: {
    color: "black",
    fontWeight: "600",
    alignSelf: "center"
  },
  toggleTextInactive: {
    color: "#6B7280",
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: "#4A3DE31A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: "#4A3DE3",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A3DE3",
  },
  activeFilterText: {
    color: "white",
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1E1E1E',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#4A3DE3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  senderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1E1E',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#999',
  },
  cancelText: {
    fontSize: 14,
    color: '#4A3DE3',
    fontWeight: '500',
  },
});