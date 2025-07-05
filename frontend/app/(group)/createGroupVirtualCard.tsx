import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/CustomButton";
import ProgressDots from "@/components/ProgressDots";
import axios from "axios";
import { useUser } from "@clerk/clerk-expo";

interface VirtualCard {
  id: string;
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
  cardholderName: string;
  status: string;
  type: string;
  currency: string;
}

interface SubscriptionData {
  subscriptionName: string;
  // Add other properties as needed
}

export default function CreateGroupVirtualCard() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useUser();
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const groupDetails = await axios.get(`${API_URL}/api/group/${groupId}`);
        const allMembers = groupDetails.data.members;
        // Charge each member
        await Promise.all(
          allMembers.map(async (member) => {
            await axios.post(`${API_URL}/api/stripe-payment/charge-user`, {
              customerStripeID: member.user.customerId,
              amount: groupDetails.data.amountEach,
              subscription: groupDetails.data.subscriptionName,
            });
          })
        );
        // After charging users, create virtual card
        createVirtualCard();
      } catch (error) {
        console.error(
          "Failed to charge user money or create virtual card",
          error
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

  const createVirtualCard = async () => {
    try {
      setLoading(true);

      // Get user's MongoDB ID
      const userResponse = await axios.get(`${API_URL}/api/user/`, {
        params: { clerkID: user?.id },
      });
      const mongoUserId = userResponse.data.id;
      // Create virtual card for the group
      const response = await axios.post(`${API_URL}/api/virtualCard/create`, {
        userId: mongoUserId,
        groupId: groupId,
      });
      if (response.data.success) {
        const cardResponse = await axios.get(`${API_URL}/api/virtualCard/${groupId}`);
        if (cardResponse.data.cards && cardResponse.data.cards.length > 0) {
          const latestCard = cardResponse.data.cards[0];
          setVirtualCard({
            id: latestCard.id,
            last4: latestCard.last4,
            expMonth: latestCard.exp_month,
            expYear: latestCard.exp_year,
            brand: latestCard.brand,
            cardholderName: latestCard.cardholder?.name || `${user?.firstName} ${user?.lastName}`,
            status: latestCard.status,
            type: latestCard.type,
            currency: latestCard.currency,
          });
        }
      }
    } catch (error) {
      console.error("Error creating virtual card:", error);
      Alert.alert("Error", "Failed to create virtual card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCardNumber = () => {
    if (virtualCard) {
      Alert.alert("Copied", "Card number copied to clipboard");
    }
  };

  const handleCopySecurityCode = () => {
    Alert.alert("Copied", "Security code copied to clipboard");
  };

  //   const handleNext = () => {
  //     router.push({
  //       pathname: '/(group)/addAccountCredentials',
  //       params: {
  //         subscriptionId: "some-id",  // Replace with actual subscription ID if needed
  //         hasVirtualCard: 'true',
  //       },
  //     });
  //   };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A3DE3" />
          <Text style={styles.loadingText}>Creating your virtual card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          Your card is <Text style={{ color: "#4A3DE3" }}>ready!</Text> 🎉
        </Text>
        <Text style={styles.text}>
          You can now use your virtual card to subscribe to the service. Tap the
          button below after subscribing to notify your group and start the
          cycle.
        </Text>
        {/* Virtual Card Display */}
        {virtualCard && (
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.virtualBadge}>
                <Text style={styles.virtualBadgeText}>Virtual</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardNumberSection}>
                <Text style={styles.cardNumberLabel}>Card number</Text>
                <View style={styles.cardNumberRow}>
                  <Text style={styles.cardNumber}>
                    {`**** **** **** ${virtualCard.last4}`}
                  </Text>
                  <Pressable
                    onPress={handleCopyCardNumber}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy-outline" size={20} color="white" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.cardDetailsRow}>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>Expiration date</Text>
                  <Text style={styles.cardDetailValue}>
                    {virtualCard.expMonth}/
                    {virtualCard.expYear.toString().slice(-2)}
                  </Text>
                </View>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>Security code</Text>
                  <View style={styles.securityCodeRow}>
                    <Text style={styles.cardDetailValue}>123</Text>
                    <Pressable
                      onPress={handleCopySecurityCode}
                      style={styles.copyButton}
                    >
                      <Ionicons name="copy-outline" size={16} color="white" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
        <Text style={styles.instructionsTitle}>
          Tap the copy button next to your virtual card number and security code
          to use them.
        </Text>
      </View>

      {/* Bottom Container to begin subscription */}
      <View style={styles.bottomContainer}>
        <CustomButton
          text="Begin subscription cycle"
          onPress={() =>
            router.push({
              pathname: "/(group)/subscribeInstruction",
              params: { groupId: groupId, virtualCard: virtualCard },
            })
          }
          size="large"
          fullWidth
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "black",
    textAlign: "left",
    marginBottom: 30,
    lineHeight: 36,
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 16,
    color: "#1C1C1C",
    textAlign: "left",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  cardContainer: {
    backgroundColor: "#4A3DE3",
    borderRadius: 16,
    padding: 24,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  virtualBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  virtualBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  cardBody: {
    gap: 24,
  },
  cardNumberSection: {
    gap: 8,
  },
  cardNumberLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  cardNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
  },
  copyButton: {
    padding: 4,
  },
  cardDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDetailItem: {
    gap: 4,
  },
  cardDetailLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  cardDetailValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  securityCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  stepContainer: {
    gap: 12,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: "#4A3DE3",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "600",
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 20,
    backgroundColor: "white", // Ensure white background
  },
  nextButton: {
    backgroundColor: "#4A3DE3",
    borderRadius: 12,
    paddingVertical: 16,
  },
});
