import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, SafeAreaView, ActivityIndicator, Pressable, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useUserState } from "@/hooks/useUserState";
import SubscriptionCard from "@/components/SubscriptionCard";
import GroupMembers from "@/components/GroupMember";
import CustomButton from "@/components/CustomButton";

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

export default function setMemberShares() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { userId } = useUserState();
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);


  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const [groupResponse] = await Promise.all([
          axios.get(`${API_URL}/api/group/${groupId}`),
        ]);
        setGroup(groupResponse.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching group details:", err);
        setError("Failed to load group details");
      } finally {
        setLoading(false);
      }
    };

    if (groupId && userId) {
      fetchGroupDetails();
    }
  }, [groupId, userId]);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >

        {/* Service Card */}
        <View style={styles.subscription}>
            <SubscriptionCard
                logo={{uri: group.subscription?.logo}}
                subscriptionName={group.subscriptionName}
                amountEach={group.amountEach.toFixed(2)}
                cycle={group.cycle}
                isShared={false} 
                category={group.category}
            />
        </View>

        {/* Service Card */}
        <View style={styles.toggleContainer}>
            <Pressable style={styles.toggleBtnActive}>
                <Text style={styles.toggleTextActive}>Split equally</Text>
            </Pressable>
            <Pressable
                style={styles.toggleBtnInactive}
                //onPress={showAllInvitations}
            >
                <Text style={styles.toggleTextInactive}>Custom amounts</Text>
            </Pressable>
        </View>

        {/* Members Section */}
        {groupId && userId && (
            <GroupMembers 
              groupId={groupId as string} 
              userId={userId} 
                showAmountEach={true}
                showEstimatedText={false}
                showInvitations={false}
                showHeader={false}
              />
        )}
      </ScrollView>
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        >
        <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Shares</Text>
            <Text style={styles.modalText}>
                You’re about to send a share request to 5 members. Each will be asked to approve their share before payment is processed.
            </Text>

            <View style={styles.modalActions}>
                <CustomButton 
                    text="Confirm & Send" 
                    onPress={() => {
                        setModalVisible(false);
                        router.push({pathname:'/(group)/newGroupDetails', params: {groupId}})}} 
                />
                <CustomButton 
                    text="Cancel" 
                    onPress={() => setModalVisible(false)} 
                    style={styles.cancelButton}
                    textStyle={styles.cancelText}/>
            </View>
            </View>
        </View>
        </Modal>
      <CustomButton text="Confirm shares" onPress={() => setModalVisible(true)} style={styles.button} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "space-between"
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
  backButton: {
    padding: 4,
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
    flex: 1, 
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignContent: "center",
    justifyContent: "center"
  },
  toggleTextActive: {
    color: "black",
    fontWeight: "600",
  },
  toggleTextInactive: {
    color: "#6B7280",
    fontWeight: "500",
  },
  subscription: {
    padding: 20
  },
  button: {
    marginVertical: 16,
    marginHorizontal: 16
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
  },
  modalActions: {
    marginTop: 12,
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#4A3DE31A"
  },
    cancelText: {
    color: '#4A3DE3',
    fontWeight: '500',
  },

});