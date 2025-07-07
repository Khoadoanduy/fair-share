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
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionModal from "@/components/AddSubscriptionModal";
import PersonalSubscriptionModal from "@/components/PersonalSubscriptionModal";
import { useUserState } from "@/hooks/useUserState";
import PaymentPromptModal from "@/components/AddPaymentMethodModal";

interface Group {
  id: string;
  groupName: string;
  subscriptionName: string;
  subscriptionId?: string;
  planName?: string;
  amountEach: number;
  amount: number;
  cycle: string;
  category: string;
  subscriptionType?: string;
  startDate?: string;
  endDate?: string;
  totalMem?: number;
  logo?: string;
  subscription?: {
    logo?: string;
    name?: string;
    category?: string;
  };
  nextPaymentDate?: string;
}

export default function GroupsScreen() {
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { userId, hasPayment } = useUserState();
  // const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{
    x: number;  
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const buttonRef = useRef<any>(null);
  const [personalSubscriptions, setPersonalSubscriptions] = useState<Group[]>([]);
  
  const handleCreateGroup = () => {
    router.push("/(group)/createGroupName");
  };
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
    if (hasPayment) {
      router.push('/(group)/createGroupName');
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleLinkPayment = () => {
    setShowPaymentModal(false);
    router.push("/(collectpayment)/CollectPayment"); // Navigate to the payment method linking screen
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
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

  const showAllInvitations = () => {
    router.push("/(group)/showAllInvitations");
  };

  const showUserGroups = () => {
    router.push('/(group)/userGroups')
  }

const fetchAllSubscriptions = async () => {
  if (!userId) return;
  try {
    const response = await axios.get(`${API_URL}/api/user/groups/${userId}`);
    const allData = response.data;
    
    const sharedGroups = allData.filter((item: { subscriptionType: string; }) => 
      item.subscriptionType !== 'personal'
    );
    const personalSubs = allData.filter((item: { subscriptionType: string; }) => 
      item.subscriptionType === 'personal'
    );

    setGroups(sharedGroups);
    setPersonalSubscriptions(personalSubs);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    setGroups([]);
    setPersonalSubscriptions([]);
  }
};

  useEffect(() => {
    if (userId) {
      fetchAllSubscriptions(); 
    }
  }, [userId]);

  const getDisplayData = () => {
    const allItems = [...groups, ...personalSubscriptions].map(item => ({
      ...item,
      logo: item.subscription?.logo ?? item.logo ?? undefined,
      isPersonal: item.subscriptionType === 'personal'
    }));

    if (selectedFilter === "Personal") {
      return allItems.filter(item => item.isPersonal);
    }
    if (selectedFilter === "Shared") {
      return allItems.filter(item => !item.isPersonal);
    }
    return allItems; 
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
          <SubscriptionCard
            group={item}
            onPress={() => {
              if (item.isPersonal) {
                router.push({
                  pathname: "/(personal)/personalSubscriptionDetails",
                  params: { groupId: item.id, fromManage: "true" },
                });
              } else {
                router.push({
                  pathname:
                    item.endDate === null
                      ? "/(group)/newGroupDetails"
                      : "/(group)/groupDetails",
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

      <PaymentPromptModal
        visible={showPaymentModal}
        onClose={handleClosePaymentModal}
        onLinkPayment={handleLinkPayment}
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
    fontWeight: "600",
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
