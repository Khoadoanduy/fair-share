import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import axios from "axios";
import CredentialsContainer from "@/components/CredentialsContainer";
import CredentialItem from "@/components/CredentialItem";
import CredentialsVisibilityToggle from "@/components/CredentialsVisibilityToggle";
import VirtualCardDisplay from "@/components/VirtualCardDisplay";

type SubscriptionDetailsData = {
  id: string;
  groupName: string;
  subscriptionName: string;
  planName: string;
  amount: number;
  cycle: string;
  currency: string;
  nextPaymentDate: string;
  cycleDays: number;
  category: string;
  virtualCardId?: string;
  subscription?: {
    id: string;
    name: string;
    logo: string;
    domain: string;
  };
  credentials: {
    username: string;
    password: string;
  } | null;
};

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
};

export default function SubscriptionDetailsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user } = useUser();
  const { groupId } = useLocalSearchParams();
  const [details, setDetails] = useState<SubscriptionDetailsData | null>(null);
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mongoUserId, setMongoUserId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (groupId && user?.id) {
      initializeData();
    }
  }, [groupId, user?.id]);

  const initializeData = async () => {
    try {
      const userResponse = await axios.get(`${API_URL}/api/user/`, {
        params: { clerkID: user?.id },
      });
      const mongoId = userResponse.data.id;
      setMongoUserId(mongoId);

      const [detailsResponse, roleResponse] = await Promise.all([
        axios.get(`${API_URL}/api/group/${groupId}`),
        axios.get(`${API_URL}/api/group/${groupId}/user-role/${mongoId}`),
      ]);

      setDetails(detailsResponse.data);
      setUserRole(roleResponse.data.role);

      // If the group has a virtual card ID, fetch the card details
      if (detailsResponse.data.virtualCardId) {
        try {
          const cardResponse = await axios.get(
            `${API_URL}/api/virtualCard/group/${groupId}`
          );
          setVirtualCard(cardResponse.data);
        } catch (cardErr) {
          console.error("Error fetching virtual card details:", cardErr);
          // Don't set an error, just log it - virtual card is optional
        }
      }
    } catch (error) {
      console.error("Failed to initialize data:", error);
      Alert.alert("Error", "Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEdit = async () => {
    if (userRole !== "leader") {
      Alert.alert(
        "Permission Denied",
        "Only group leaders can edit credentials"
      );
      return;
    }

    if (isEditing) {
      // Save action
      if (!editUsername.trim() || !editPassword.trim()) {
        Alert.alert("Error", "Please fill in both username and password");
        return;
      }

      try {
        if (!mongoUserId) {
          Alert.alert("Error", "User not found");
          return;
        }

        await axios.put(`${API_URL}/api/group/${groupId}/credentials`, {
          credentialUsername: editUsername.trim(),
          credentialPassword: editPassword.trim(),
          userId: mongoUserId,
        });

        const response = await axios.get(
          `${API_URL}/api/group/${groupId}`
        );
        setDetails(response.data);

        setIsEditing(false);
        Alert.alert("Success", "Credentials updated successfully");
      } catch (error) {
        console.error("Failed to update credentials:", error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          Alert.alert(
            "Permission Denied",
            "Only group leaders can update credentials"
          );
        } else {
          Alert.alert("Error", "Failed to update credentials");
        }
      }
    } else {
      // Edit action
      setEditUsername(details?.credentials?.username || "");
      setEditPassword(details?.credentials?.password || "");
      setIsEditing(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading subscription details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!details) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Failed to load subscription details</Text>
          <Pressable style={styles.retryButton} onPress={initializeData}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={router.back}>
            <Ionicons name="chevron-back" size={24} color="#4A3DE3" />
          </Pressable>
          <Text style={styles.title}>Subscription details</Text>
          <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name="create-outline" size={24} color="#4A3DE3" />
          </Pressable>
        </View>

        {/* Subscription Card */}
        <View style={styles.subscriptionCard}>
          {details.subscription?.logo ? (
            <Image
              source={{ uri: details.subscription.logo }}
              style={styles.logo}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>
                {details.subscriptionName?.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.serviceName}>{details.subscriptionName}</Text>
          <Text style={styles.price}>${details.amount}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{details.category}</Text>
          </View>
        </View>

        {/* Account Credentials Section */}
        <View style={styles.section}>
          {isEditing ? (
            /* Editing mode with consistent styling */
            <View style={styles.editingCredentialsContainer}>
              <View style={styles.editingHeader}>
                <Text style={styles.editingSectionTitle}>
                  Account credentials
                </Text>
                <CredentialsVisibilityToggle
                  isVisible={isVisible}
                  onToggle={() => setIsVisible(!isVisible)}
                  size={24} // Increased from 20 to 24 to match default
                />
              </View>

              <Text style={styles.editingWarning}>
                Do not share your credentials with others.
              </Text>

              <View style={styles.editingCredentialsBox}>
                <View style={styles.editingCredentialItem}>
                  <View style={styles.editingCredentialIcon}>
                    <Ionicons name="person" size={20} color="white" />
                  </View>
                  <View style={styles.editingCredentialInfo}>
                    <Text style={styles.editingCredentialLabel}>
                      Username/Email
                    </Text>
                    <TextInput
                      style={styles.editingInput}
                      value={editUsername}
                      onChangeText={setEditUsername}
                      placeholder="Enter username or email"
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.editingCredentialItem}>
                  <View style={styles.editingCredentialIcon}>
                    <Ionicons name="lock-closed" size={20} color="white" />
                  </View>
                  <View style={styles.editingCredentialInfo}>
                    <Text style={styles.editingCredentialLabel}>Password</Text>
                    <TextInput
                      style={styles.editingInput}
                      value={editPassword}
                      onChangeText={setEditPassword}
                      placeholder="Enter password"
                      placeholderTextColor="#999"
                      secureTextEntry={!isVisible}
                    />
                  </View>
                </View>
              </View>

              <Pressable style={styles.saveButton} onPress={handleToggleEdit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          ) : details.credentials ? (
            /* Display mode using CredentialsContainer component */
            <View style={styles.credentialsWrapper}>
              <CredentialsContainer
                email={details.credentials.username}
                password={details.credentials.password}
              />
            </View>
          ) : (
            /* No credentials */
            <View style={styles.noCredentialsContainer}>
              <Text style={styles.sectionTitle}>Account credentials</Text>
              <View style={styles.noCredentials}>
                <Text style={styles.noCredentialsText}>
                  {userRole === "leader"
                    ? "No credentials added yet. Tap the edit icon to add account credentials."
                    : "No credentials available. The group leader needs to add them."}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Subscription Details Section - Updated to match credentials container format */}
        <View style={styles.section}>
          <View style={styles.subscriptionDetailsContainer}>
            <Text style={styles.subscriptionDetailsTitle}>
              Subscription details
            </Text>

            <View style={styles.subscriptionDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Group name</Text>
                <Text style={styles.detailValue}>{details.groupName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan</Text>
                <Text style={styles.detailValue}>{details.planName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Billing cycle</Text>
                <Text style={styles.detailValue}>{details.cycleDays} Days</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next payment</Text>
                <View>
                  <Text style={styles.detailValue}>
                    {details.nextPaymentDate
                      ? new Date(details.nextPaymentDate).toLocaleDateString()
                      : "Not available"}
                  </Text>
                </View>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Your role</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color: userRole === "leader" ? "#4A3DE3" : "#666",
                    },
                  ]}
                >
                  {userRole === "leader" ? "👑 Leader" : "👤 Member"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Virtual Card Section */}
        {virtualCard && (
          <View style={styles.section}>
            <View style={styles.virtualCardContainer}>
              <Text style={styles.sectionTitle}>Virtual Card</Text>
              <VirtualCardDisplay
                cardBrand={virtualCard.brand}
                last4={virtualCard.last4}
                expMonth={virtualCard.expMonth}
                expYear={virtualCard.expYear}
                cardholderName={virtualCard.cardholderName}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  retryButton: {
    backgroundColor: "#4A3DE3",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: { color: "white", fontWeight: "500" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // Changed from space-between to center
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
  editButton: {
    padding: 4,
  },
  subscriptionCard: {
    alignItems: "center",
    paddingVertical: 32,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
  },
  logo: { width: 60, height: 60, borderRadius: 30, marginBottom: 16 },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A3DE3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: { color: "white", fontSize: 24, fontWeight: "600" },
  serviceName: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  price: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  categoryBadge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: { fontSize: 12, color: "#4CAF50", fontWeight: "500" },
  section: { marginHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 19, fontWeight: "600" },

  // Fixed credentials wrapper alignment
  credentialsWrapper: {
    // Remove the negative marginTop that was causing misalignment
    // marginTop: -8, // Remove this line
  },

  // Consistent editing mode styles that match CredentialsContainer
  editingCredentialsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  editingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editingSectionTitle: {
    fontSize: 19,
    fontWeight: "600",
  },
  editingWarning: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  editingCredentialsBox: {
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
    padding: 12,
    marginBottom: 16,
  },
  editingCredentialItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginVertical: 2,
  },
  editingCredentialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  editingCredentialInfo: {
    flex: 1,
  },
  editingCredentialLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  editingInput: {
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    minHeight: 40,
  },
  saveButton: {
    backgroundColor: "#4A3DE3",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // No credentials
  noCredentialsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  noCredentials: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderStyle: "dashed",
    marginTop: 8,
  },
  noCredentialsText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },

  // NEW: Subscription details container to match credentials container
  subscriptionDetailsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  subscriptionDetailsTitle: {
    fontSize: 19,
    fontWeight: "600",
    marginBottom: 16, // Add some space before the details box
  },
  subscriptionDetailsBox: {
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
    padding: 12,
  },

  // Updated detail row styles for the new container
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // Slightly darker for better visibility in the gray box
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    flex: 1, // Add flex for better layout
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
    flex: 1, // Add flex for better layout
  },
  detailSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 2,
  },

  // Payment history button
  paymentHistoryButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  paymentHistoryText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Updated virtual card container style
  virtualCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
});
