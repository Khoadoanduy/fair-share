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
  Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useUserState } from "@/hooks/useUserState";
import SubscriptionCard from "@/components/SubscriptionCard";
import GroupMembers from "@/components/GroupMember";
import GroupHeader from "@/components/GroupHeader";
import { Modal } from "react-native";

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
  const [confirmRequestSent, setConfirmRequestSent] = useState<boolean>(false);
  const { userId } = useUserState();
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [isSubscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const [allConfirmed, setAllConfirmed] = useState(false);


  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const [groupResponse, roleResponse, requestSent, shareConfirmed, checkAllConfirmed] = await Promise.all([
          axios.get(`${API_URL}/api/group/${groupId}`),
          axios.get(`${API_URL}/api/groupMember/${groupId}/${userId}`),
          axios.get(`${API_URL}/api/cfshare/leader-sent/${groupId}`),
          axios.get(`${API_URL}/api/cfshare/check-status/${groupId}/${userId}`),
          axios.get(`${API_URL}/api/cfshare/all-confirmed/${groupId}`)
        ]);
        setGroup(groupResponse.data);
        setIsLeader(roleResponse.data.isLeader);
        setConfirmRequestSent(requestSent.data);
        setConfirmShare(shareConfirmed.data);
        setAllConfirmed(checkAllConfirmed.data);
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
  const togglePaymentModal = () => {
    setPaymentModalVisible(!isPaymentModalVisible);
  };

  const toggleSubscribeModal = () => {
    setSubscribeModalVisible(!isSubscribeModalVisible);
  }

  const handleConfirmShare = async () => {
    try {
      const response = await axios.put(`${API_URL}/api/cfshare/${groupId}/${userId}`);

      if (response.status === 200) {
        console.log("Success", "Your share has been confirmed!");
      }

    } catch (error) {
      console.error("Error confirming share:", error);
    } finally {
      togglePaymentModal(); // Close the modal after confirming
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Propmt member to confirm share request */}
        {confirmRequestSent && !leader && !confirmShare && (
          <View style={styles.viewShareContainer}>
            <Image source={require('../../assets/money-square.png')}/>
            <View style={styles.viewShareContent}>
              <Text style={{ color: 'black', fontWeight: '600' }}>Confirm your share</Text>
              <Text style={{color: '#6D717F'}}>
                Your group leader has finalized the members. Confirm your share to proceed with payment.
              </Text>
              <TouchableOpacity onPress={togglePaymentModal}>
                <Text style={{ color: '#4A3DE3', fontWeight: '600' }}>View Payment Here</Text>
              </TouchableOpacity>
            </View>
          </View>
          )
        }

        {/* Prompt leader to charge members and start subscription */}
        {confirmRequestSent && leader && allConfirmed && (
          <View style={styles.viewShareContainer}>
            <Image source={require('../../assets/Vector.png')}/>
            <View style={styles.viewShareContent}>
              <Text style={{ color: 'black', fontWeight: '600' }}>Subscribe with virtual card</Text>
              <Text style={{color: '#6D717F'}}>
                All members have confirmed their shares. You can now pull funds, generate a virtual card, and subscribe to the service!
              </Text>
              <TouchableOpacity onPress={toggleSubscribeModal}>
                <Text style={{ color: '#4A3DE3', fontWeight: '600' }}>Get started</Text>
              </TouchableOpacity>
            </View>
          </View>
          )
        }

        {/* Top Info Card */}
        <GroupHeader
          groupName={group.groupName}
          showShare={false}
          showPayment={false}
        />

        {/* Service Card */}
        <View style={styles.serviceCard}>
          <SubscriptionCard
              logo={{uri: group.subscription?.logo}}
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
          confirmRequestSent ?
            <GroupMembers 
              groupId={groupId as string} 
              userId={userId} 
              showAmountEach={false}
              showEstimatedText={false}
              showInvitations={false}
              showHeader={true}
              requestConfirmSent={true}
            /> :
            <GroupMembers 
              groupId={groupId as string} 
              userId={userId} 
              showAmountEach={true}
              showEstimatedText={true}
              showInvitations={true}
              showHeader={true}
              requestConfirmSent={false}
            />
        )}
      </ScrollView>

      {/* Model for members to confirm share request */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPaymentModalVisible}
        onRequestClose={togglePaymentModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomModal}>
            <Text style={styles.modalTitle}>Confirm your share</Text>
            <Text style={styles.modalMessage}>
              The leader has finalized the member list.{'\n'}Your share is
            </Text>
            <Text style={styles.modalAmount}>${group?.amountEach.toFixed(2)}/month</Text>
            <Text style={styles.modalInfo}>
              You won’t be charged until everyone confirms and{'\n'}the leader creates the subscription.
            </Text>
            <TouchableOpacity style={styles.seeSharesRow} onPress={() => setShowMembers(!showMembers)}>
              <Text style={styles.seeSharesText}>See all members’ shares</Text>
              <Ionicons name="chevron-down" size={16} color="#4A3DE3" />
            </TouchableOpacity>
            {showMembers && (
              <GroupMembers 
                groupId={groupId as string} 
                userId={userId} 
                showAmountEach={true}
                showEstimatedText={false}
                showInvitations={false}
                showHeader={false}
                requestConfirmSent={false}
              />
            )}
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={togglePaymentModal}
              >
                <Text style={[styles.buttonText, styles.declineText]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={() => {
                  handleConfirmShare();
                }}
              >
                <Text style={[styles.buttonText, styles.confirmText]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for leader to subscribe */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSubscribeModalVisible}
        onRequestClose={toggleSubscribeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomModal}>
            <Text style={[styles.modalTitle, {color: 'black'}]}>
              Subscribe to {group.subscriptionName} {"\n"}with your group’s{" "}
              <Text style={{ color: '#4A3DE3' }}>virtual card</Text>!
            </Text>
            <Text style={styles.modalMessage}>
              All members have confirmed their shares. 
              You can now pull funds, generate a virtual card, 
              and use it to subscribe to the service.
            </Text>
            <View style={styles.stepContainer}>
                <View style={styles.stepItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#34D399" style={styles.stepIcon} />
                  <View style={styles.stepTextContainer}>
                    <Text style={[styles.stepTitle, {color: 'black'}]}>Confirm member shares</Text>
                    <Text style={[styles.stepSub, {color: '#64748B'}]}>Review and confirm each member's share</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.stepItem}>
                  <Ionicons name="card" size={24} color="black" style={styles.stepIcon} />
                  <View style={styles.stepTextContainer}>
                    <Text style={[styles.stepTitle, {color: 'black'}]}>Pull funds & generate virtual card</Text>
                    <Text style={[styles.stepSub, {color: '#64748B'}]}>Pull funds from members and generate a virtual card</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>

                <View style={styles.stepItem}>
                  <Ionicons name="wallet-outline" size={24} color="#C7C7CC" style={styles.stepIcon} />
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepTitle}>Subscribe to Netflix</Text>
                    <Text style={styles.stepSub}>Use the card to subscribe to the service</Text>
                  </View>
                </View>

                <View style={styles.stepItem}>
                  <Ionicons name="checkbox-outline" size={24} color="#C7C7CC" style={styles.stepIcon} />
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepTitle}>Start cycle</Text>
                    <Text style={styles.stepSub}>Confirm the subscription and notify members</Text>
                  </View>
                </View>

                <View style={styles.stepItem}>
                  <Ionicons name="create-outline" size={24} color="#C7C7CC" style={styles.stepIcon} />
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepTitle}>Update account credentials</Text>
                    <Text style={styles.stepSub}>Enter the login details for the shared subscription</Text>
                  </View>
                </View>
            </View>
          </View>
        </View>
      </Modal>
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
  viewShareContainer: {
    flexDirection: 'row',
    borderColor: '#4A3DE3',
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: '#4A3DE30D',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 15,
    justifyContent: 'space-between',
    gap: 12,
  },
  viewShareContent: {
    flex: 1,
    flexDirection: 'column',
    flexShrink: 1,
    gap: 5
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  bottomModal: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A3DE3',
    marginBottom: 12,
    textAlign: 'center',
  },

  modalMessage: {
    fontSize: 14,
    color: '#6D717F',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },

  modalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center'
  },

  modalInfo: {
    fontSize: 13,
    color: '#6D717F',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },

  seeSharesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    textAlign: 'center',
    alignSelf: 'center'
  },

  seeSharesText: {
    color: '#4A3DE3',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
    textAlign: 'center'
  },

  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 16,
  },

  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  declineButton: {
    backgroundColor: '#4A3DE31A',
  },

  confirmButton: {
    backgroundColor: '#4A3DE3',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  declineText: {
    color: '#4A3DE3',
  },

  confirmText: {
    color: 'white',
  },
  stepContainer: {
    marginTop: 10,
    gap: 16,
    marginBottom: 15,
  },

  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },

  stepIcon: {
    marginRight: 12,
  },

  stepTextContainer: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },

  stepSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },

});