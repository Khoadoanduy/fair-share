import React, { useState, useEffect } from "react";
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

export default function ProfileScreen() {
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customerStripeID, setCustomerStripeID] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string>("");

  const handleSignOutPress = async () => {
    try {
      await signOut();
      router.replace("/(welcome)");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const fetchUserProfile = async () => {
    if (!isSignedIn || !user) return null;

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      const response = await axios.get(`${API_URL}/api/user`, {
        params: { clerkID: user.id },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userData = response.data;
      if (userData) {
        setCustomerStripeID(userData.customerId);
        
        // Get customer details to find default payment method
        if (userData.customerId) {
          const customerResponse = await axios.get(
            `${API_URL}/api/stripe-customer/customers/${userData.customerId}`
          );
          
          const defaultPM = customerResponse.data.customer?.invoice_settings?.default_payment_method;
          if (defaultPM) {
            setDefaultPaymentMethodId(defaultPM);
          }
        }
        
        return userData;
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!customerStripeID) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/stripe-customer/retrieve-paymentMethodId`,
        { params: { customerStripeID } }
      );
      if (response.data?.data) {
        setPaymentMethods(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoading(true);

      if (!user?.primaryEmailAddress?.emailAddress) {
        Alert.alert("Error", "Email address is required");
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/stripe-customer/create-setup-intent`,
        { email: user.primaryEmailAddress.emailAddress }
      );

      const { setupIntent, ephemeralKey, customer } = response.data;

      if (!customerStripeID) {
        const token = await getToken();
        await axios.put(
          `${API_URL}/api/user/${user.id}`,
          { customerId: customer },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setCustomerStripeID(customer);
      }

      const { error } = await initPaymentSheet({
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

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();
      if (!presentError) {
        Alert.alert("Success", "Payment method added successfully");
        await fetchPaymentMethods();
      }
    } catch (error) {
      console.error("Error adding payment method:", error);
      Alert.alert("Error", "Failed to add payment method");
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
              await axios.delete(
                `${API_URL}/api/stripe-customer/payment-methods/${paymentMethodId}`
              );
              Alert.alert("Success", "Payment method deleted successfully");
              await fetchPaymentMethods();
            } catch (error) {
              console.error("Error deleting payment method:", error);
              Alert.alert("Error", "Failed to delete payment method");
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
        paymentMethodId: paymentMethodId,
      });
      
      setDefaultPaymentMethodId(paymentMethodId);
      Alert.alert("Success", "Default payment method updated");
    } catch (error) {
      console.error("Error setting default payment method:", error);
      Alert.alert("Error", "Failed to set default payment method");
    }
  };

  const navigateToPersonalInfo = () => {
    router.push("/(profile)/personalInfo");
  };

  useEffect(() => {
    if (isSignedIn) {
      const initializeUserData = async () => {
        setIsLoading(true);
        try {
          const userData = await fetchUserProfile();
          if (userData?.customerId) {
            setCustomerStripeID(userData.customerId);
          }
        } catch (error) {
          console.error("Error initializing user data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      initializeUserData();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (customerStripeID) {
      fetchPaymentMethods();
    }
  }, [customerStripeID]);

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
          {/* Header - Centered */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#4353FD" />
            </TouchableOpacity>
          </View>

          {/* Profile Avatar Section */}
          <View style={styles.avatarContainer}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
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

          {/* Personal Information Card */}
          <TouchableOpacity
            style={styles.personalInfoCard}
            onPress={navigateToPersonalInfo}
          >
            <View style={styles.personalInfoContent}>
              <Ionicons name="person-outline" size={24} color="#4353FD" />
              <Text style={styles.personalInfoText}>Personal information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Payment Methods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            {paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
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
                      <Text style={styles.paymentMethodText}>
                        •••• {method.card.last4}
                      </Text>
                      {defaultPaymentMethodId === method.id && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.paymentMethodExpiry}>
                      Expires {method.card.exp_month}/{method.card.exp_year}
                    </Text>
                  </View>
                  
                  <View style={styles.cardActions}>
                    {defaultPaymentMethodId !== method.id && (
                      <TouchableOpacity
                        onPress={() => handleSetDefaultPaymentMethod(method.id)}
                        style={styles.setDefaultButton}
                      >
                        <Text style={styles.setDefaultText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeletePaymentMethod(method.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF4B55" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.infoValue}>No payment methods added</Text>
            )}
          </View>

          {/* Add Payment Method Button */}
          <TouchableOpacity
            style={styles.addPaymentMethodButton}
            onPress={handleAddPaymentMethod}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.addPaymentMethodText}>Add Payment Method</Text>
          </TouchableOpacity>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutCard}
            onPress={handleSignOutPress}
          >
            <Ionicons name="log-out-outline" size={24} color="#000" />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  headerSpacer: {
    width: 40, // Same width as notification button for balance
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#4353FD",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 12,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardBrandImage: {
    width: 40,
    height: 24,
    resizeMode: "contain",
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: "500",
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4353FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  userHandle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  personalInfoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  personalInfoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  personalInfoText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  addPaymentMethodButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4353FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  addPaymentMethodText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
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
  logoutText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
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
  },
  defaultBadge: {
    backgroundColor: "#4353FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  setDefaultButton: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  setDefaultText: {
    color: "#4353FD",
    fontSize: 12,
    fontWeight: "500",
  },
});
