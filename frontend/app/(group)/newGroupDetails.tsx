import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useUserState } from "@/hooks/useUserState";
import SubscriptionCard from "@/components/SubscriptionCard";
import GroupMembers from "@/components/GroupMember";

// Define the Group type
type GroupMember = {
  id: string;
  userId: string;
  userRole: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
};

type Group = {
  id: string;
  groupName: string;
  subscriptionName: string;
  planName: string;
  amount: number;
  amountEach: number;
  totalMem: number;
  logo: string;
  cycle: string;
  cycleDays: number;
  category: string;
  startDate: string;
  endDate: string;
  members: GroupMember[];
  daysUntilNextPayment: number;
  nextPaymentDate: string;
  subscription?: {
    id: string;
    name: string;
    logo: string;
    category: string;
    domain: string;
  };
};

export default function GroupDetailsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leader, setIsLeader] = useState<boolean>(false);
  const { userId } = useUserState();
  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const [groupResponse, roleResponse] = await Promise.all([
          axios.get(`${API_URL}/api/group/${groupId}`),
          axios.get(`${API_URL}/api/groupMember/${groupId}/${userId}`),
        ]);
        setGroup(groupResponse.data);
        setIsLeader(roleResponse.data.isLeader);
        setError(null);
      } catch (err) {
        console.error("Error fetching group details:", err);
        setError("Failed to load group details");
        Alert.alert("Error", "Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    if (groupId && userId) {
      fetchGroupDetails();
    }
  }, [groupId, userId]);
  const handleInviteMembers = () => {
    router.push({
      pathname: "/(group)/inviteMember",
      params: { groupId },
    });
  };

  // Add this near the other handler functions, before the return statement
  const handleSubscriptionDetails = () => {
    router.push({
      pathname: "/(group)/SubscriptionDetails",
      params: { groupId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4353FD" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error || "Group not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }


  // Update the JSX for the info cards
  const InfoCard = ({
    label,
    icon,
  }) => (
    <View style={styles.infoCard}>
      <View style={styles.labelContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Ionicons name={icon} size={24} color="#000" />
      </View>
      <View style={styles.infoValueContainer}>
        <View style={styles.placeholderBox} />
      </View>
    </View>
  );

  //const handleChargeMoney = router.push('/(group)/setMemberShares')

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Info Card */}
        <View style={styles.topCard}>
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#4353ED" />
            <Text style={styles.groupName}>{group.groupName}</Text>
          </View>

          <View style={styles.infoCardsContainer}>
            <InfoCard
              label="Your share"
              icon="pie-chart-outline"
            />
            <InfoCard
              label="Payment in"
              icon="time-outline"
            />
          </View>
        </View>

        {/* Service Card */}
        <View style={styles.serviceCard}>
          <SubscriptionCard
              logo={{uri: group.subscription?.logo}}
              subscriptionName={group.subscriptionName}
              amountEach={group.amountEach.toFixed(2)}
              cycle={group.cycle}
              isShared={true} // or item.isShared if available
              category={group.category}
          />
          <TouchableOpacity
            style={styles.detailsRow}
            onPress={handleSubscriptionDetails}
          >
            <View style={styles.detailsLeft}>
              <Ionicons name="person-outline" size={24} color="#000" />
              <Text style={styles.detailsText}>Subscription details</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
          </TouchableOpacity>
        </View>


        {/* Members Section */}
        {groupId && userId && (
            <GroupMembers 
              groupId={groupId as string} 
              userId={userId} 
                showAmountEach={true}
                showEstimatedText={true}
                showInvitations={true}
                showHeader={true}
              />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  topCard: {
    backgroundColor: "#4A3DE31A",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 24,
    padding: 15,
  },
  lockContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Add this
    marginBottom: 15,
    width: "100%", // Add this
  },
  groupName: {
    fontSize: 32,
    fontWeight: "600",
    color: "#4A3DE3",
    marginLeft: 12,
    textAlign: "center", // Add this
  },
  infoCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#FCFBFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoValue: {
    fontSize: 30,
    fontWeight: "600",
    color: "#4A3DE3",
  },
  serviceCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: "#4CD964",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  serviceRight: {
    alignItems: "flex-end",
  },
  servicePriceAmount: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  servicePriceCycle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  detailsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailsText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
  },
  placeholderBox: {
    width: 80,
    height: 30,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    },

});