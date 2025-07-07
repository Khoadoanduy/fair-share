import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import axios from "axios";
import CustomButton from "../../components/CustomButton";
import { Ionicons } from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PersonalInfoScreen() {
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [addressData, setAddressData] = useState<{
    country: string;
    street: string;
    apartment: string;
    city: string;
    state: string;
    zipCode: string;
  }>({
    country: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        setUserProfile(userData);
        setPhoneNumber(userData.phoneNumber || "");

        if (userData.address) {
          setAddressData(userData.address);
        } else {
          setAddressData({
            country: "",
            street: "",
            apartment: "",
            city: "",
            state: "",
            zipCode: "",
          });
        }

        // Fetch payment methods if user has Stripe customer ID
        if (userData.customerId) {
          try {
            const paymentResponse = await axios.get(
              `${API_URL}/api/stripe-customer/retrieve-paymentMethodId`,
              { params: { customerStripeID: userData.customerId } }
            );
            if (paymentResponse.data?.data) {
              setPaymentMethods(paymentResponse.data.data);
            }
          } catch (error) {
            console.error("Error fetching payment methods:", error);
          }
        }

        return userData;
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not connect to server");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!isSignedIn || !user) return;
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      // Validate phone number (optional field)
      if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
        Alert.alert("Invalid Input", "Please enter a valid phone number");
        return;
      }

      // Check if any address field is filled
      const hasAddressData = Object.values(addressData).some(
        (value) => value.trim() !== ""
      );

      // Send address only if at least one field is filled
      const addressToSend = hasAddressData ? addressData : null;

      const response = await axios.put(
        `${API_URL}/api/user/${user.id}`,
        {
          phoneNumber: phoneNumber || null,
          address: addressToSend,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedUser = response.data;
      if (updatedUser) {
        setUserProfile(updatedUser);
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Update Failed", "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An error occurred while updating your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Discard changes
      setPhoneNumber(userProfile?.phoneNumber || "");
      if (userProfile?.address) {
        setAddressData(userProfile.address);
      } else {
        setAddressData({
          country: "",
          street: "",
          apartment: "",
          city: "",
          state: "",
          zipCode: "",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchUserProfile();
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.message}>Please sign in to view your information</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4A3DE3" />
            </View>
          )}

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Profile</Text>
              </View>
              <TouchableOpacity
                onPress={toggleEditMode}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>
                  {isEditing ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Personal Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {user?.fullName || `${user?.firstName} ${user?.lastName}`}
              </Text>

              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>

            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>

              <Text style={styles.label}>Phone Number:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>
                  {userProfile?.phoneNumber || "Not provided"}
                </Text>
              )}
            </View>

            {/* Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>

              {isEditing ? (
                <View>
                  <Text style={styles.label}>Country:</Text>
                  <TextInput
                    style={styles.input}
                    value={addressData.country}
                    onChangeText={(text) =>
                      setAddressData({ ...addressData, country: text })
                    }
                    placeholder="Country"
                  />

                  <Text style={styles.label}>Street:</Text>
                  <TextInput
                    style={styles.input}
                    value={addressData.street}
                    onChangeText={(text) =>
                      setAddressData({ ...addressData, street: text })
                    }
                    placeholder="Street address"
                  />

                  <Text style={styles.label}>Apartment (optional):</Text>
                  <TextInput
                    style={styles.input}
                    value={addressData.apartment}
                    onChangeText={(text) =>
                      setAddressData({ ...addressData, apartment: text })
                    }
                    placeholder="Apartment, suite, etc."
                  />

                  <Text style={styles.label}>City:</Text>
                  <TextInput
                    style={styles.input}
                    value={addressData.city}
                    onChangeText={(text) =>
                      setAddressData({ ...addressData, city: text })
                    }
                    placeholder="City"
                  />

                  <Text style={styles.label}>State:</Text>
                  <TextInput
                    style={styles.input}
                    value={addressData.state}
                    onChangeText={(text) =>
                      setAddressData({ ...addressData, state: text })
                    }
                    placeholder="State"
                  />

                  <Text style={styles.label}>Zip Code:</Text>
                  <TextInput
                    style={styles.input}
                    value={addressData.zipCode}
                    onChangeText={(text) =>
                      setAddressData({ ...addressData, zipCode: text })
                    }
                    placeholder="Zip code"
                    keyboardType="numeric"
                  />
                </View>
              ) : (
                <View>
                  {userProfile?.address ? (
                    <View>
                      <Text style={styles.value}>
                        {userProfile.address.street}
                        {userProfile.address.apartment
                          ? `, ${userProfile.address.apartment}`
                          : ""}
                      </Text>
                      <Text style={styles.value}>
                        {userProfile.address.city}, {userProfile.address.state}{" "}
                        {userProfile.address.zipCode}
                      </Text>
                      <Text style={styles.value}>
                        {userProfile.address.country}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.value}>No address provided</Text>
                  )}
                </View>
              )}
            </View>

            {/* Payment Methods Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Methods</Text>
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <View key={method.id} style={styles.paymentMethodItem}>
                    <Image
                      source={
                        method.card.brand === "visa"
                          ? require("../../assets/images/visa-240.png")
                          : require("../../assets/images/mastercard-240.png")
                      }
                      style={styles.cardBrandImage}
                    />
                    <View style={styles.paymentMethodDetails}>
                      <Text style={styles.paymentMethodText}>
                        •••• {method.card.last4}
                      </Text>
                      <Text style={styles.paymentMethodExpiry}>
                        Expires {method.card.exp_month}/{method.card.exp_year}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.value}>No payment methods added</Text>
              )}
            </View>

            {/* Save Button in Edit Mode */}
            {isEditing && (
              <CustomButton
                text="Save Changes"
                onPress={updateProfile}
                style={styles.saveButton}
              />
            )}

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutCard} onPress={handleSignOutPress}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 0, // Remove any padding
  },
  backButton: {
    width: 60,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start", // Align icon to the left
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  editButton: {
    width: 60,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end", // Align text to the right
  },
  editButtonText: {
    color: "#4A3DE3",
    fontWeight: "500",
    fontSize: 16,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A3DE3",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    marginTop: 16,
  },
  value: {
    fontSize: 16,
    color: "#000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
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
    marginBottom: 4,
  },
  paymentMethodExpiry: {
    fontSize: 14,
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#4A3DE3",
    marginBottom: 24,
  },
  signOutCard: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  signOutText: {
    color: "#FF4B55",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
});