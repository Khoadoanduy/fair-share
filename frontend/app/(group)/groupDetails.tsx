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
  Pressable,
  Image, // Add this import
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import { formatPaymentDate, getDaysRemaining } from "@/utils/dateUtils";
import VirtualCardDisplay from "@/components/VirtualCardDisplay";
import { useUserState } from "@/hooks/useUserState";
import GroupMembers from "@/components/GroupMember";
import SubscriptionCard from "@/components/SubscriptionCard";
import GroupHeader from "@/components/GroupHeader";

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

interface Group {
  id: string;
  groupName: string;
  subscriptionName: string;
  planName: string;
  amount: number;
  amountEach: number;
  totalMem: number;
  cycle: string;
  cycleDays: number;
  category: string;
  startDate: string;
  endDate: string;
  members: GroupMember[];
  daysUntilNextPayment: number;
  nextPaymentDate: string;
  visibility?: string; // Add to the Group interface
  virtualCardId?: string;
  logo?: string;
  subscription?: {
    id: string;
    name: string;
    logo: string;
    category: string;
    domain: string;
  }; // Add this field
}

type VirtualCard = {
  id: string;
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
  cardholderName: string;
  status: string;
  type: string;
  currency: string;
  number: number;
  cvc: number;
};

export default function GroupDetailsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leader, setIsLeader] = useState<boolean>(false);
  const { userId } = useUserState();
  const [isModalVisible, setIsModalVisible] = useState(false);

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

        // If the group has a virtual card ID, fetch the card details
        if (groupResponse.data.virtualCardId) {
          try {
            const cardResponse = await axios.get(
              `${API_URL}/api/virtualCard/${groupId}`
            );
            setVirtualCard(cardResponse.data);
          } catch (cardErr) {
            console.error("Error fetching virtual card details:", cardErr);
            // Don't set an error, just log it - virtual card is optional
          }
        }
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
      pathname: "/(group)/subscriptionDetails",
      params: { groupId },
    });
  };

  const handleLeaveGroup = async () => {
    try {
      await axios.delete( `${API_URL}/api/groupMember/${groupId}/${userId}`);
    } catch (cardErr) {
      console.error("Error deleting member from group", cardErr);
    }
  }


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A3DE3" />
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

  const daysRemaining = getDaysRemaining(group.nextPaymentDate);

  return (
    <SafeAreaView style={styles.container}>
      {/* Add this header */}
      {/* <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#4A3DE3" />
        </Pressable>
        <Text style={styles.title}>Group Details</Text>
        <View style={{ width: 24 }} />
      </View> */}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Info Card */}
        <GroupHeader
          groupName={group.groupName}
          amountEach={group.amountEach.toFixed(2)}
          daysUntilNextPayment={group.daysUntilNextPayment}
          showShare={true}
          showPayment={true}
        />

        {/* Service Card */}
        <View style={styles.serviceCard}>
          <SubscriptionCard
            logo={{ uri: group.subscription?.logo }}
            subscriptionName={group.subscriptionName}
            amountEach={group.amountEach}
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
            showEstimatedText={false}
            showInvitations={true}
            showHeader={true}
            requestConfirmSent={false}
            startCycle={true}
          />
        )}

        <View style={styles.virtualCardSection}>
          <Text style={styles.sectionTitle}>Virtual Card</Text>
          <VirtualCardDisplay
            cardBrand={virtualCard?.brand}
            number={virtualCard?.number}
            cvc={virtualCard?.cvc}
            expMonth={virtualCard?.expMonth}
            expYear={virtualCard?.expYear}
            cardholderName={virtualCard?.cardholderName}
          />
        </View>
                
          {!leader && (
            <CustomButton
              text="Leave Group"
              onPress={() => setIsModalVisible(true)}
              size="large"
              style={styles.leaveButton}
            />
          )}
        </ScrollView>
                {!leader && (
                  <TouchableOpacity
                    style={[styles.leaveButton, {backgroundColor: 'white'}]}
                    onPress={() => setIsModalVisible(true)}
                  >
                    <Feather name="log-out" size={24} color="red" />
                    <Text style={[styles.leaveButtonText, {color: 'red'}]}>Leave Group</Text>
                  </TouchableOpacity>
                )}
              <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)} // Close modal on back press
              >
                <View style={styles.modalBackground}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Leave {group.groupName}?</Text>
                    <Text style={{color: '#64748B'}}>
                      If you leave, you’ll lose your spot and future payments will stop. 
                      This action can’t be undone.
                      </Text>
                    <View style={styles.modalActions}>
                      <CustomButton
                        text="Leave"
                        onPress={async () => {
                          await handleLeaveGroup(); 
                          setIsModalVisible(false); 
                          router.push('/(tabs)/groups');
                        }}
                        textStyle={{color: '#4A3DE3'}}
                        style={styles.confirmLeave}
                      />
                      <CustomButton
                        text="Cancel"
                        onPress={() => setIsModalVisible(false)}
                        style={styles.cancelButton}
                      />
                    </View>
                  </View>
                </View>
              </Modal>

    </SafeAreaView>
  );
}

const getAvatarColor = (index: number) => {
  const colors = ["#4CD964", "#007AFF", "#5856D6", "#34C759", "#FF9500"];
  return colors[index % colors.length];
};

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
  virtualCardSection: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  createVirtualCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  createVirtualCardText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4A3DE3",
    marginLeft: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4A3DE3",
  },
  topCard: {
    backgroundColor: "#4A3DE31A",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 24,
    padding: 24,
  },
  lockContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Add this
    marginBottom: 24,
    width: "100%", // Add this
  },
  groupName: {
    fontSize: 32,
    fontWeight: "600",
    color: "#4A3DE3",
    marginLeft: 12,
    textAlign: "center", // Add this
  },
  visibilityBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  visibilityText: {
    fontSize: 12,
    color: "#4A3DE3",
    fontWeight: "500",
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
  serviceLogo: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 12,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "#4A3DE3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
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
    fontSize: 20,
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
  membersSection: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  membersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  addButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitials: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  leaderBadge: {
    backgroundColor: "#4A3DE3", // Using the primary purple color
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  leaderText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  memberUsername: {
    fontSize: 14,
    color: "#64748B", // Using the subtitle color
    marginTop: 2,
  },
  memberAmount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  paymentMethodRow: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  creditCard: {
    backgroundColor: "#C4C4C4",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    height: 200,
    padding: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  discoverText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginRight: 8,
  },
  itLogo: {
    backgroundColor: "#FF6600",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 24,
    height: 18,
  },
  itText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFF",
  },
  leaveButton: {
    marginHorizontal: 20, 
    alignItems: "center", 
    width: "90%",
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    gap: 10
  },
  leaveButtonText: {
    alignSelf: 'center'
  },
  cancelButton: {
    marginHorizontal: 20, 
    alignSelf: "center", 
    width: "90%",
    backgroundColor: "#4A3DE3"
  }, 
  confirmLeave: {
    marginHorizontal: 20, 
    alignSelf: "center", 
    width: "90%",
    backgroundColor: "#4A3DE31A"
  }, 
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark background
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    justifyContent: 'center'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20
  },
});
