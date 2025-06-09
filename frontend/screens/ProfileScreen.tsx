import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useStripe, PaymentSheet } from "@stripe/stripe-react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export default function ProfileScreen() {
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customerStripeID, setCustomerStripeID] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string>("");

  // Sort payment methods with default first
  const sortedPaymentMethods = paymentMethods.sort((a, b) =>
    defaultPaymentMethodId === a.id ? -1 : defaultPaymentMethodId === b.id ? 1 : 0
  );

  const showAlert = (title: string, message: string) => Alert.alert(title, message);

  const handleSignOutPress = async () => {
    try {
      await signOut();
      router.replace("/(welcome)");
    } catch (error) {
      showAlert("Error", "Failed to sign out");
    }
  };

  const fetchUserData = async () => {
    if (!isSignedIn || !user?.id) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/api/user`, {
        params: { clerkID: user.id },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.customerId) {
        setCustomerStripeID(response.data.customerId);
        await fetchPaymentMethods(response.data.customerId);
        await fetchDefaultPaymentMethod(response.data.customerId);
      }
    } catch (error) {
      showAlert("Error", "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async (customerId?: string) => {
    const id = customerId || customerStripeID;
    if (!id) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/stripe-customer/retrieve-paymentMethodId`,
        { params: { customerStripeID: id } }
      );
      setPaymentMethods(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const fetchDefaultPaymentMethod = async (customerId?: string) => {
    const id = customerId || customerStripeID;
    if (!id) return;

    try {
      const response = await axios.get(`${API_URL}/api/stripe-customer/customers/${id}`);
      const defaultPM = response.data.customer?.invoice_settings?.default_payment_method;
      if (defaultPM) setDefaultPaymentMethodId(defaultPM);
    } catch (error) {
      console.error("Error fetching default payment method:", error);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      showAlert("Error", "Email address is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/stripe-customer/create-setup-intent`,
        { email: user.primaryEmailAddress.emailAddress }
      );

      const { setupIntent, ephemeralKey, customer } = response.data;

      // Update customer ID if needed
      if (!customerStripeID && user?.id) {
        const token = await getToken();
        await axios.put(
          `${API_URL}/api/user/${user.id}`,
          { customerId: customer },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCustomerStripeID(customer);
      }

      // Setup and present payment sheet
      await initPaymentSheet({
        merchantDisplayName: "FairShare",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        billingDetailsCollectionConfiguration: {
          email: PaymentSheet.CollectionMode.NEVER,
          address: PaymentSheet.AddressCollectionMode.FULL,
          attachDefaultsToPaymentMethod: true,
        },
      });

      const { error } = await presentPaymentSheet();
      if (error) throw new Error(error.message);

      showAlert("Success", "Payment method added successfully");
      await fetchPaymentMethods();
    } catch (error: any) {
      showAlert("Error", error.message || "Failed to add payment method");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePaymentMethod = (paymentMethodId: string) => {
    Alert.alert(
      "Delete Payment Method",
      "Are you sure you want to delete this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/stripe-customer/payment-methods/${paymentMethodId}`);
              showAlert("Success", "Payment method deleted successfully");
              await fetchPaymentMethods();
            } catch (error) {
              showAlert("Error", "Failed to delete payment method");
            }
          },
        },
      ]
    );
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await axios.post(`${API_URL}/api/stripe-customer/set-default-payment-method`, {
        customerId: customerStripeID,
        paymentMethodId,
      });
      setDefaultPaymentMethodId(paymentMethodId);
      showAlert("Success", "Default payment method updated");
    } catch (error) {
      showAlert("Error", "Failed to set default payment method");
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <View key={method.id} style={styles.paymentMethodItem}>
      <Image
        source={
          method.card.brand === "visa"
            ? require("../assets/images/visa-240.png")
            : require("../assets/images/mastercard-240.png")
        }
        style={styles.cardBrandImage}
      />
      <View style={styles.paymentMethodDetails}>
        <View style={styles.cardInfo}>
          <Text style={styles.paymentMethodText}>•••• {method.card.last4}</Text>
          {/* Default badge or Set Default button in the same position */}
          {defaultPaymentMethodId === method.id ? (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => handleSetDefaultPaymentMethod(method.id)}
              style={styles.setDefaultButton}
            >
              <Text style={styles.setDefaultText}>Set Default</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.paymentMethodExpiry}>
          Expires {method.card.exp_month}/{method.card.exp_year}
        </Text>
      </View>

      {/* Only delete button in the actions column */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => handleDeletePaymentMethod(method.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color="#FF4B55" />
        </TouchableOpacity>
      </View>
    </View>
  );

  useEffect(() => {
    if (isSignedIn) fetchUserData();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.message}>Please sign in to view your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4353FD" />
          </View>
        )}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#4353FD" />
            </TouchableOpacity>
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>
              {user?.fullName || `${user?.firstName} ${user?.lastName}`}
            </Text>
            <Text style={styles.userHandle}>
              @{user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0]}
            </Text>
          </View>

          {/* Personal Information */}
          <TouchableOpacity
            style={styles.personalInfoCard}
            onPress={() => router.push("/(profile)/personalInfo")}
          >
            <View style={styles.personalInfoContent}>
              <Ionicons name="person-outline" size={24} color="#4353FD" />
              <Text style={styles.personalInfoText}>Personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            {sortedPaymentMethods.length > 0 ? (
              sortedPaymentMethods.map(renderPaymentMethod)
            ) : (
              <Text style={styles.infoValue}>No payment methods added</Text>
            )}
          </View>

          {/* Add Payment Method */}
          <TouchableOpacity style={styles.addPaymentMethodButton} onPress={handleAddPaymentMethod}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addPaymentMethodText}>Add Payment Method</Text>
          </TouchableOpacity>

          {/* Log Out */}
          <TouchableOpacity style={styles.logoutCard} onPress={handleSignOutPress}>
            <Ionicons name="log-out-outline" size={24} color="#000" />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  headerSpacer: { width: 40 },
  notificationButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", flex: 1, textAlign: "center" },
  message: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  section: { marginBottom: 24, backgroundColor: "#f9f9f9", borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#4353FD" },
  userName: { fontSize: 24, fontWeight: "600", marginBottom: 8 },
  infoValue: { fontSize: 16, marginBottom: 12 },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16, // Reduced from 16 to make cards more compact
    borderRadius: 12, // Reduced from 12 for consistency
    marginBottom: 12, // Reduced from 12 for tighter spacing
    elevation: 1, // Reduced shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Lighter shadow
    shadowRadius: 2,
    height: 70, // Fixed height for consistency
  },
  cardBrandImage: {
    width: 40, // Slightly smaller
    height: 28, // Slightly smaller
    resizeMode: "contain",
    marginRight: 16
  },
  paymentMethodDetails: {
    flex: 1,
    justifyContent: "center",
  },
  paymentMethodText: {
    fontSize: 16, // Slightly smaller
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  paymentMethodExpiry: {
    fontSize: 12, // Smaller
    color: "#666",
    fontWeight: "400",
  },
  deleteButton: {
    width: 28, // Smaller delete button
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  avatarContainer: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4353FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  userHandle: { fontSize: 16, color: "#666", marginBottom: 8 },
  personalInfoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  personalInfoContent: { flexDirection: "row", alignItems: "center" },
  personalInfoText: { fontSize: 16, fontWeight: "500", marginLeft: 8 },
  addPaymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4353FD",
    borderRadius: 8, // Smaller radius
    paddingVertical: 12, // Reduced from 16
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 48, // Fixed height to match other elements
  },
  addPaymentMethodText: {
    color: "#fff",
    fontSize: 15, // Slightly smaller
    fontWeight: "500",
    marginLeft: 6 // Reduced spacing
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoutText: { color: "#000", fontSize: 16, fontWeight: "500", marginLeft: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8, // Add gap between card number and button/badge
  },
  defaultBadge: {
    backgroundColor: "#4353FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24, // Fixed height for consistency
    justifyContent: "center",
  },
  defaultText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500"
  },
  setDefaultButton: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    height: 24, // Same height as default badge
    justifyContent: "center",
  },
  setDefaultText: {
    color: "#4353FD",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  cardActions: {
    alignItems: "center",
    justifyContent: "center",
    width: 40, // Just enough for delete button
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
});