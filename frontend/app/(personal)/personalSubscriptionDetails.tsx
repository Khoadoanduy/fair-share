import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Pressable, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import CredentialsContainer from '@/components/CredentialsContainer';
import CredentialsVisibilityToggle from '@/components/CredentialsVisibilityToggle';
import VirtualCardDisplay from '@/components/VirtualCardDisplay';
import { useUserState } from '@/hooks/useUserState';

type PersonalSubscriptionData = {
  id: string;
  subscriptionName: string;
  planName: string;
  amount: number;
  cycle: string;
  cycleDays: number;
  category: string;
  logo?: string;
  subscription?: {
    id: string;
    name: string;
    logo: string;
    domain: string;
  };
  credentialUsername?: string;
  credentialPassword?: string;
  virtualCardId?: string;
  subscriptionType?: string;
  personalType?: string; 
  startDate?: string; 
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
export default function PersonalSubscriptionDetailsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { groupId, fromManage } = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useUserState();
  const [subscriptionData, setSubscriptionData] = useState<PersonalSubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      try {
        // Use unified endpoint for fetching group (personal subscription) details
        const response = await axios.get(`${API_URL}/api/group/${groupId}`);
        setSubscriptionData(response.data);
        setEditUsername(response.data.credentialUsername || "");
        setEditPassword(response.data.credentialPassword || "");

        // Fetch virtual card if subscription has a virtualCardId and personalType is 'virtual'
        if (response.data.virtualCardId && response.data.personalType === 'virtual') {
          try {

            const cardResponse = await axios.get(`${API_URL}/api/virtualCard/${groupId}`);

            if (cardResponse.status !== 200) {
              console.error('Failed to load virtual card: status', cardResponse.status, cardResponse.data);
            } else if (cardResponse.data && cardResponse.data.id) {
              setVirtualCard({
                id: cardResponse.data.id,
                last4: cardResponse.data.last4,
                expMonth: cardResponse.data.expMonth,
                expYear: cardResponse.data.expYear,
                brand: cardResponse.data.brand,
                cardholderName: cardResponse.data.cardholderName,
                status: cardResponse.data.status,
                type: cardResponse.data.type,
                currency: cardResponse.data.currency
              });
            }
          } catch (cardError) {
            console.error('Failed to load virtual card:', cardError);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load subscription details');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchSubscriptionDetails();
    }
  }, [groupId]);

  const handleBack = () => {
    router.push('/(tabs)/groups'); // Always go to GroupsScreen
  };

  const handleSaveCredentials = async () => {
    if (!editUsername.trim() || !editPassword.trim()) {
      Alert.alert('Error', 'Please fill in both username and password');
      return;
    }

    try {
      // Use unified endpoint for credentials update
      await axios.put(`${API_URL}/api/group/${groupId}/credentials`, {
        credentialUsername: editUsername.trim(),
        credentialPassword: editPassword.trim(),
        userId,
      });
      // Refresh data using unified endpoint
      const response = await axios.get(`${API_URL}/api/group/${groupId}`);
      setSubscriptionData(response.data);
      setIsEditing(false);
      Alert.alert('Success', 'Credentials updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update credentials');
    }
  };

  const getNextPaymentDate = () => {
    if (!subscriptionData?.startDate || !subscriptionData?.cycleDays) return "";
    const start = new Date(subscriptionData.startDate);
    start.setDate(start.getDate() + subscriptionData.cycleDays);
    return start.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A3DE3" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!subscriptionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Subscription not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header - Keep only this back button */}
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#4A3DE3" />
          </Pressable>
          <Text style={styles.title}>Subscription details</Text>
          <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name="create-outline" size={24} color="#4A3DE3" />
          </Pressable>
        </View>

        {/* Main Card Container */}
        <View style={styles.mainCard}>
          {/* Service Header with real logo */}
          <View style={styles.serviceHeader}>
            {subscriptionData.subscription?.logo || subscriptionData.logo ? (
              <Image
                source={{ uri: subscriptionData.subscription?.logo || subscriptionData.logo }}
                style={styles.serviceLogo}
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>{subscriptionData.subscriptionName ? subscriptionData.subscriptionName.charAt(0) : "?"}</Text>
              </View>
            )}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{subscriptionData.subscriptionName}</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.personalBadge}>
                  <Text style={styles.personalText}>Personal</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{subscriptionData.category}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Amount and Payment Info Cards */}
          <View style={styles.infoCardsContainer}>
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.infoLabel}>Amount</Text>
                <Ionicons name="pie-chart-outline" size={20} color="#666" />
              </View>
              <Text style={styles.infoValue}>${subscriptionData.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.infoLabel}>Payment in</Text>
                <Ionicons name="time-outline" size={20} color="#666" />
              </View>
              <Text style={styles.infoValue}>{subscriptionData.cycleDays} days</Text>
            </View>
          </View>

          {/* Subscription Details Section */}
          <View style={styles.subscriptionDetailsSection}>
            <Text style={styles.sectionTitle}>Subscription details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>{subscriptionData.planName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Billing cycle</Text>
              <Text style={styles.detailValue}>Monthly</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Next payment</Text>
              <View>
                <Text style={styles.detailValue}>{getNextPaymentDate()}</Text>
                <Text style={styles.detailSubtext}>In {subscriptionData.cycleDays} days</Text>
              </View>
            </View>
          </View>

          {/* Virtual Card Section - Add this */}
          {subscriptionData?.personalType === 'virtual' && virtualCard && (
            <View style={styles.virtualCardSection}>
              <Text style={styles.sectionTitle}>Virtual Card</Text>
              <VirtualCardDisplay
                cardBrand={virtualCard.brand || "visa"}
                last4={virtualCard.last4}
                expMonth={virtualCard.expMonth}
                expYear={virtualCard.expYear}
                cardholderName={virtualCard.cardholderName}
              />
            </View>
          )}

          {/* Account Credentials Section */}
          {isEditing ? (
            /* Editing mode with consistent styling */
            <View style={styles.editingCredentialsContainer}>
              <View style={styles.editingHeader}>
                <Text style={styles.editingSectionTitle}>
                  Account credentials
                </Text>
                <Pressable onPress={() => setIsVisible(!isVisible)}>
                  <Ionicons
                    name={isVisible ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
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

              <Pressable style={styles.saveButton} onPress={handleSaveCredentials}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          ) : subscriptionData.credentialUsername ? (
            /* Display mode using CredentialsContainer component */
            <View style={styles.credentialsWrapper}>
              <CredentialsContainer
                email={subscriptionData.credentialUsername}
                password={subscriptionData.credentialPassword || ""}
              />
            </View>
          ) : (
            /* No credentials */
            <View style={styles.credentialsSection}>
              <Text style={styles.sectionTitle}>Account credentials</Text>
              <View style={styles.noCredentialsContainer}>
                <Text style={styles.noCredentialsText}>
                  No credentials added yet. Tap the edit icon to add account credentials.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },

  // Header
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
  editButton: {
    padding: 4,
  },

  // Main card container
  mainCard: {
    backgroundColor: "#E8E4FF",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
  },

  // Service header
  serviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  serviceLogo: {
    width: 60,  // Increase from default
    height: 60, // Increase from default
    borderRadius: 30,
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 60,  // Match the logo size
    height: 60, // Match the logo size
    borderRadius: 12,
    backgroundColor: "#4A3DE3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoText: {
    color: "white",
    fontSize: 24, // Increase font size for larger logo
    fontWeight: "600",
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
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  personalBadge: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  personalText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  categoryBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },

  // Info cards
  infoCardsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#4A3DE3",
  },

  // Subscription details section
  subscriptionDetailsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    textAlign: "right",
  },
  detailSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
    marginTop: 2,
  },

  // Credentials section
  credentialsSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  credentialsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  credentialsContainer: {
    gap: 12,
  },
  credentialRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  credentialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  credentialContent: {
    flex: 1,
  },
  credentialLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  credentialValue: {
    fontSize: 16,
    color: "#000",
  },
  copyButton: {
    padding: 8,
  },
  noCredentialsContainer: {
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderStyle: "dashed",
  },
  noCredentialsText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },

  // Editing styles (keeping existing ones)
  editingContainer: {
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
    marginBottom: 20,
  },
  credentialItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginVertical: 2,
  },
  input: {
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
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // New styles for credentials card
  credentialsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  credentialsContent: {
    marginTop: 8,
  },

  // New styles for editing credentials section
  editingCredentialsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  editingSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  editingWarning: {
    fontSize: 14,
    color: "#D9534F",
    marginBottom: 12,
    textAlign: "center",
  },
  editingCredentialsBox: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  editingCredentialItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
    fontSize: 14,
    color: "#666",
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
  credentialsWrapper: {
    marginTop: 8,
  },

  // Add this new style
  virtualCardSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
});
