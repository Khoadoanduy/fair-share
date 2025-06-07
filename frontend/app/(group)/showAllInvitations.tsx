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
import GroupCard from '@/components/GroupCard';

export default function AllInvitations() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useUser();
  const clerkId = user?.id;
  const [invitations, setInvitations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [responseStatus, setResponseStatus] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [leaders, setLeaders] = useState({}); // To store group leaders data

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

    if (userId) {
      fetchInvitations();
    }
  }, [userId]);

  // Fetch leaders for all groups
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const leaderData = {};

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
      <Text style={styles.subtitle}>Invitations</Text>
      <Text style={styles.normal}>Review and respond to group invitations</Text>
      {invitations.length > 0 ? (
        invitations.map((invite, index) => {
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
              <GroupCard
                logo={{ uri: invite.group.logo }}
                subscriptionName={invite.group.subscriptionName}
                cycle={invite.group.cycle}
                isShared={true}
                category={invite.group.category}
              />
              <View style={styles.buttonContainer}>
                <AcceptInvitationButton
                  userId={userId}
                  groupId={groupId}
                  disabled={responseStatus[groupId] !== undefined}
                  onResponse={() => handleInvitationResponse(groupId, 'accepted')}
                  style={[
                    styles.button,
                    responseStatus[groupId] === 'accepted' && styles.accepted,
                  ]}
                />
                <DeclineInvitationButton
                  userId={userId}
                  groupId={groupId}
                  disabled={responseStatus[groupId] !== undefined}
                  onResponse={() => handleInvitationResponse(groupId, 'declined')}
                  style={[
                    styles.button,
                    responseStatus[groupId] === 'declined' && styles.declined,
                  ]}
                />
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No invitations found.</Text>
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
    justifyContent: "space-evenly",
    gap: 10,
    backgroundColor: "#4A3DE31A",
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  toggleBtnActive: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: -25,
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
  button: {
    flex: 1,
  },
  accepted: {
    backgroundColor: '#4caf50',
  },
  declined: {
    backgroundColor: '#f44336',
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
    marginBottom: 20
  },
});