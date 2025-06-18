import CustomButton from "@/components/CustomButton";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  FlatList,
  Pressable,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import GroupCard from '@/components/GroupCard';
import AddSubscriptionModal from '@/components/AddSubscriptionModal';
import PersonalSubscriptionModal from '@/components/PersonalSubscriptionModal';

interface Group {
  id: string;
  groupName: string;
  subscriptionName: string;
  subscriptionId?: string;
  planName?: string;
  amountEach: number;
  cycle: string;
  category: string;
  startDate?: string;
  endDate?: string;
  totalMem?: number;
  logo?: string;
  subscription?: {
    logo?: string;
    name?: string;
    category?: string;
  };
}

export default function GroupsScreen() {
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const buttonRef = useRef<any>(null);
  const clerkId = user?.id;
  const [personalSubscriptions, setPersonalSubscriptions] = useState<PersonalSubscription[]>([]);

  interface PersonalSubscription {
    id: string;
    subscriptionName: string;
    planName: string;
    amount: number;
    cycle: string;
    category: string;
    logo?: string;
    subscription?: {
      logo?: string;
      name?: string;
      category?: string;
    };
    credentialUsername?: string;
    credentialPassword?: string;
  }

  const handleCreateGroup = () => {
    router.push("/(group)/createGroupName");
  };

  const showAllInvitations = () => {
    router.push("/(group)/showAllInvitations");
  };

  const showUserGroups = () => {
    router.push('/(group)/userGroups')
  }

  const handleAddPress = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
        setButtonPosition({ x: px, y: py, width, height });
        setShowAddModal(true);
      });
    } else {
      setShowAddModal(true);
    }
  };

  const handlePersonalPress = () => {
    setShowAddModal(false);
    router.push('/(personal)/personalSubscriptionChoice');
  };

  const handleGroupPress = () => {
    setShowAddModal(false);
    router.push('/(group)/createGroupName');
  };

  const handleExistingSubscription = () => {
    setShowPersonalModal(false);
    router.push({
      pathname: '/(personal)/personalSubscriptionInfo',
      params: { subscriptionType: 'existing' }
    });
  };

  const handleVirtualCardSubscription = () => {
    setShowPersonalModal(false);
    router.push({
      pathname: '/(personal)/personalSubscriptionInfo',
      params: { subscriptionType: 'virtual' }
    });
  };

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/user/`, {
          params: { clerkID: clerkId },
        });
        setUserId(response.data.id);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (clerkId) {
      fetchUserId();
    }
  }, [clerkId]);

  const fetchGroups = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/api/user/groups/${userId}`);
      // The groups are nested in the response as group property
      const transformedGroups = response.data.map((item: any) => ({
        id: item.group.id,
        groupName: item.group.groupName,
        subscriptionName: item.group.subscriptionName,
        subscriptionId: item.group.subscriptionId,
        planName: item.group.planName,
        amountEach: item.group.amountEach,
        cycle: item.group.cycle,
        category: item.group.category,
        logo: item.group.subscription?.logo || item.group.logo, // Add this line
        startDate: item.group.startDate,
        endDate: item.group.endDate,
        totalMem: item.group.totalMem,
      }));
      setGroups(transformedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchPersonalSubscriptions = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/api/personal-subscription/user/${userId}`);
      setPersonalSubscriptions(response.data);
    } catch (error) {
      console.error("Error fetching personal subscriptions:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchGroups();
      fetchPersonalSubscriptions();
    }
  }, [userId]);

  const getDisplayData = () => {
    // Add personal subscriptions
    const personalSubs = personalSubscriptions.map(sub => ({
      id: sub.id,
      groupName: sub.subscriptionName,
      subscriptionName: sub.subscriptionName,
      planName: sub.planName,
      amountEach: sub.amount,
      cycle: sub.cycle,
      category: sub.category,
      logo: sub.subscription?.logo || sub.logo,
      isPersonal: true
    }));

    // Add group subscriptions with real logos
    const groupSubs = groups.map(group => ({
      ...group,
      logo: group.subscription?.logo || group.logo,
      isPersonal: false
    }));

    if (selectedFilter === "Personal") {
      return personalSubs;
    } else if (selectedFilter === "Shared") {
      return groupSubs;
    } else {
      // "All" - combine both
      return [...personalSubs, ...groupSubs];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Subscriptions</Text>
        <Pressable onPress={showUserGroups}>
          <Ionicons name="list" size={20} color="#4A3DE3" />
        </Pressable>
      </View>
      <View style={styles.toggleContainer}>
        <Pressable style={styles.toggleBtnActive}>
          <Text style={styles.toggleTextActive}>My Subscriptions</Text>
        </Pressable>
        <Pressable
          style={styles.toggleBtnInactive}
          onPress={showAllInvitations}
        >
          <Text style={styles.toggleTextInactive}>Pending</Text>
        </Pressable>
      </View>
      <View style={styles.filterContainer}>
        {["All", "Personal", "Shared"].map((filter) => (
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
      <FlatList
        data={getDisplayData()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => {
              if (item.isPersonal) {
                router.push({
                  pathname: '/(personal)/personalSubscriptionDetails',
                  params: { subscriptionId: item.id, fromManage: 'true' }
                });
              } else {
                router.push({
                  pathname: "/(group)/groupDetails",
                  params: { groupId: item.id },
                });
              }
            }}
          />
        )}
      />
      <Pressable
        ref={buttonRef}
        style={styles.floatingButton}
        onPress={handleAddPress}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>

      <AddSubscriptionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPersonalPress={handlePersonalPress}
        onGroupPress={handleGroupPress}
      />

      <PersonalSubscriptionModal
        visible={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        onExistingPress={handleExistingSubscription}
        onVirtualCardPress={handleVirtualCardSubscription}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A3DE3",
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
  listContainer: {
    padding: 20,
  },
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A3DE3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
