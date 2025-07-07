import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CustomButton from "../../components/CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressDots from "@/components/ProgressDots";
import { useUserState } from "@/hooks/useUserState";
import { useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import axios from "axios";

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
  daysUntilNextPayment: number;
  nextPaymentDate: string;
  maxMember: number;
  visbility: string;
  virtualCardId?: string;
  logo?: string;
  subscription?: {
    id: string;
    name: string;
    logo: string;
    category: string;
    domain: string;
  };
}

export default function confirmInfo() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const { hasPayment } = useUserState();
  const [group, setGroup] = useState<Group | null>(null);

  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);

  const [editedGroupName, setEditedGroupName] = useState("");
  const [editedMaxMembers, setEditedMaxMembers] = useState("");
  const [editedVisibility, setEditedVisibility] = useState("");

  const [editedCycle, setEditedCycle] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedPlanName, setEditedPlanName] = useState("");

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/group/${groupId}`);
        const data = response.data;
        setGroup(data);

        // populate editable fields
        setEditedGroupName(data.groupName);
        setEditedMaxMembers(String(data.maxMember));
        setEditedVisibility(data.visbility || "Private");
        setEditedCycle(data.cycle);
        setEditedAmount(String(data.amount));
        setEditedPlanName(data.planName);
      } catch (err) {
        console.error("Error fetching group details:", err);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const onConfirm = async () => {
    if (!editedGroupName.trim()) {
      Alert.alert("Missing Group Name", "Please enter a group name.");
      return;
    }

    if (hasPayment === false) {
      return;
    }

    try {
      await axios.put(`${API_URL}/api/group/${groupId}`, {
        groupName: editedGroupName,
        maxMember: Number(editedMaxMembers),
        visbility: editedVisibility,
        visbility: editedCycle,
        amount: Number(editedAmount),
        planName: editedPlanName,
      });

      router.push({
        pathname: "/(group)/inviteMember",
        params: { groupId: groupId },
      });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  return (
    <SafeAreaView style={styles.contentContainer}>
      <View>
        <Text style={styles.title}>Confirm information</Text>
        <Text style={styles.subtitle}>
          Confirm your group and subscription information before inviting
          members to your group.
        </Text>

        {/* Group Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Group</Text>
            <TouchableOpacity
              onPress={() => setIsEditingGroup(!isEditingGroup)}
            >
              <Feather name="edit" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {isEditingGroup ? (
            <>
              <Text style={styles.inputLabel}>Group Name</Text>
              <TextInput
                style={styles.input}
                value={editedGroupName}
                onChangeText={setEditedGroupName}
                placeholder="Group Name"
              />

              <Text style={styles.inputLabel}>Max Members</Text>
              <TextInput
                style={styles.input}
                value={editedMaxMembers}
                onChangeText={setEditedMaxMembers}
                placeholder="Max Members"
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Visibility</Text>
              <View style={styles.visibilityOptions}>
                {["Private", "Friends"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.visibilityOption,
                      editedVisibility === option && styles.visibilityOptionSelected,
                    ]}
                    onPress={() => setEditedVisibility(option)}
                  >
                    <Text
                      style={[
                        styles.visibilityText,
                        editedVisibility === option && styles.visibilityTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Group Name</Text>
                <Text style={styles.infoValue}>{group?.groupName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max members</Text>
                <Text style={styles.infoValue}>{group?.maxMember}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Visibility</Text>
                <Text style={styles.infoValue}>{group?.visbility}</Text>
              </View>
            </>
          )}
        </View>

        {/* Subscription Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Subscription</Text>
            <TouchableOpacity
              onPress={() =>
                setIsEditingSubscription(!isEditingSubscription)
              }
            >
              <Feather name="edit" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {isEditingSubscription ? (
            <>
              <Text style={styles.inputLabel}>Payment Every</Text>
              <TextInput
                style={styles.input}
                value={editedCycle}
                onChangeText={setEditedCycle}
                placeholder="Cycle"
              />

              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                value={editedAmount}
                onChangeText={setEditedAmount}
                placeholder="Amount"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Plan Name</Text>
              <TextInput
                style={styles.input}
                value={editedPlanName}
                onChangeText={setEditedPlanName}
                placeholder="Plan Name"
              />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Subscription</Text>
                <Text style={styles.infoValue}>
                  {group?.subscription?.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>
                    {group?.subscription?.category}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment every</Text>
                <Text style={styles.infoValue}>{group?.cycle}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount</Text>
                <Text style={styles.infoValue}>
                  ${group?.amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>{group?.planName}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View>
        <ProgressDots totalSteps={4} currentStep={3} />
        <CustomButton
          text="Confirm"
          onPress={onConfirm}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
    color: "#4A3DE3",
  },
  subtitle: {
    alignSelf: "center",
    color: "#64748B",
    fontSize: 14,
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  categoryTag: {
    backgroundColor: "#D1FAE5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 14,
    color: "#065F46",
    fontWeight: "500",
  },
  inputLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#FFF",
  },
  visibilityOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  visibilityOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
  },
  visibilityOptionSelected: {
    backgroundColor: "#E0E7FF",
    borderColor: "#4F46E5",
  },
  visibilityText: {
    color: "#475569",
    fontSize: 14,
  },
  visibilityTextSelected: {
    color: "#1E3A8A",
    fontWeight: "600",
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
});
