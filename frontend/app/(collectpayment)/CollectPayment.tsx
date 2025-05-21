import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { useStripe,PaymentSheet } from "@stripe/stripe-react-native";
import axios from "axios";
import { useUser } from "@clerk/clerk-expo";
import { useAppDispatch } from "@/redux/hooks";
import { useUserState } from "@/hooks/useUserState";
import { setHasPayment, setStripeCustomerId } from "@/redux/slices/userSlice";
import { formatISO } from "date-fns";
import { router } from "expo-router";

const API_URL = "http://localhost:3000";

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

export default function CollectPaymentScreen() {
  const countryCodes: CountryCode[] = [
    { code: "+1", country: "United States", flag: "🇺🇸" },
    { code: "+1", country: "Canada", flag: "🇨🇦" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
    { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
    // ... remaining country codes (abbreviated for readability)
  ];
  
  // Get user object
  const { user } = useUser();
  const clerkId = user?.id; // Get Clerk user ID
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const userState = useUserState();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const filteredCountries = searchQuery
    ? countryCodes.filter(
        (country) =>
          country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.code.includes(searchQuery)
      )
    : countryCodes;

  const validateInputs = () => {
    // Validate DOB
    if (!dateOfBirth) {
      Alert.alert("Error", "Please enter your date of birth");
      return false;
    }

    const dobRegex = /^(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12]\d|3[01])\s*\/\s*\d{4}$/;
    if (!dobRegex.test(dateOfBirth)) {
      Alert.alert("Error", "Please enter a valid date in MM/DD/YYYY format");
      return false;
    }

    // Validate phone number (optional)
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber.replace(/\D/g, ""))) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return false;
    }

    return true;
  };

  const updateUserInfo = async (): Promise<boolean> => {
    if (!clerkId) {
      console.log("Missing clerk ID");
      return false;
    }
  
    try {
      // Validate inputs before proceeding
      if (!validateInputs()) {
        return false;
      }
  
      // Format phone number with country code
      const formattedPhone = phoneNumber ? 
        `${selectedCountry.code}${phoneNumber.replace(/\D/g, "")}` : 
        null;
  
      // Parse and validate date
      const [month, day, year] = dateOfBirth
        .split("/")
        .map((num) => num.trim());
      const dob = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
      const response = await axios.put(`${API_URL}/api/user/${clerkId}`, {
        phoneNumber: formattedPhone,
        dateOfBirth: formatISO(dob),
      });
  
      return response.status === 200;
    } catch (error) {
      console.error("Error updating user info:", error);
      Alert.alert("Error", "Failed to update user information");
      return false;
    }
  };
  
  const fetchPaymentSheetParams = async () => {
    try {
      console.log(" I'm at fetchPaymentSheetParams")
      const customerInfo = userState.email;
      const response = await axios.post(`${API_URL}/api/stripe/payment-sheet`, { customerInfo });
      const { setupIntent, ephemeralKey, customer } = response.data;
      console.log(customer)
      console.log(clerkId)
      console.log("CLICK CALLED PUT STRIPE ID")
      const res = await axios.put(`${API_URL}/api/user/${clerkId}/${customer}`) 
      
      return { setupIntent, ephemeralKey, customer };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      Alert.alert("Error", "Could not connect to payment service");
      return null;
    }
  };
  
  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      const params = await fetchPaymentSheetParams();
  
      if (!params) {
        throw new Error("Failed to fetch Stripe parameters");
      }
  
      const { setupIntent, ephemeralKey, customer } = params;
      
      const { error } = await initPaymentSheet({
        merchantDisplayName: "FairShare",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        defaultBillingDetails: {
          email: 'foo@bar.com',
        },
        billingDetailsCollectionConfiguration: {
          email: PaymentSheet.CollectionMode.NEVER,
          address: PaymentSheet.AddressCollectionMode.FULL,
          attachDefaultsToPaymentMethod: true
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing payment sheet:", error);
      Alert.alert("Error", "Failed to initialize payment");
      return false;
    }
  };
  
  const handleNext = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // First update user info
      const userUpdateSuccess = await updateUserInfo();
      if (!userUpdateSuccess) {
        return;
      }
      
      // Then initialize payment sheet
      const paymentInitSuccess = await initializePaymentSheet();
      if (paymentInitSuccess) {
        // Present payment sheet or continue to next step
        const { error } = await presentPaymentSheet();
        if (error) {
          console.error("Error presenting payment sheet:", error);
          Alert.alert("Error", error.message || "Payment failed");
        } else {
          // Payment successful
          Alert.alert("Success", "Your payment method was set up successfully");
          // Update Redux state to reflect payment method added
          dispatch(setHasPayment(true));
          router.push("/(tabs)/profile");
          // Navigate to next screen or update UI as needed
        }
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatDOB = (text: string): string => {
    // Remove any non-digit characters
    const numbers = text.replace(/\D/g, "");

    // Add slashes after month and day
    if (numbers.length >= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
        4,
        8
      )}`;
    } else if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }
    return numbers;
  };

  // Custom icon components for React Native
  const ChevronDownIcon = () => (
    <View style={styles.chevronIcon}>
      <View style={styles.chevronLine1} />
      <View style={styles.chevronLine2} />
    </View>
  );

  const CloseIcon = () => (
    <View style={styles.closeIcon}>
      <View style={styles.closeLine1} />
      <View style={styles.closeLine2} />
    </View>
  );

  const SearchIcon = () => (
    <View style={styles.searchIcon}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.secureText}>
            Your information is encrypted and not stored on our servers.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Date of birth<Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.helper}>
              This information is used to confirm the cardholder's identity.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="MM / DD / YYYY"
              value={dateOfBirth}
              onChangeText={(text) => setDateOfBirth(formatDOB(text))}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.phoneInputContainer}>
              {/* Country code selector */}
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.countryCode}>
                  {selectedCountry.flag} {selectedCountry.code}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              {/* Phone number input */}
              <TextInput
                style={styles.phoneInput}
                placeholder="123-456-7890"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>
        </View>

        {/* Country selection modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <CloseIcon />
                </TouchableOpacity>
              </View>

              {/* Search input */}
              <View style={styles.searchContainer}>
                <SearchIcon />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search country or code"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>

              {/* Country list */}
              <FlatList
                data={filteredCountries}
                keyExtractor={(item, index) => `${item.country}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <View style={styles.countryInfo}>
                      <Text style={styles.countryName}>{item.country}</Text>
                      <Text style={styles.countryDialCode}>{item.code}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </SafeAreaView>
        </Modal>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.nextButtonText}>Loading...</Text>
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 8,
  },
  secureText: {
    fontSize: 14,
    color: "#6B7280",
  },
  form: {
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  required: {
    color: "#EF4444",
  },
  helper: {
    fontSize: 14,
    color: "#6B7280",
  },
  nameInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  halfInput: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: "#4F46E5",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 32,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Phone input specific styles
  phoneInputContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  countryCode: {
    marginRight: 5,
    fontSize: 16,
    color: "#1F2937",
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    color: "#1F2937",
  },
  countryDialCode: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  // Custom icon styles
  chevronIcon: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  chevronLine1: {
    position: "absolute",
    width: 7,
    height: 2,
    backgroundColor: "#6B7280",
    transform: [{ rotate: "45deg" }],
    left: 0,
  },
  chevronLine2: {
    position: "absolute",
    width: 7,
    height: 2,
    backgroundColor: "#6B7280",
    transform: [{ rotate: "-45deg" }],
    right: 0,
  },
  closeIcon: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeLine1: {
    position: "absolute",
    width: 16,
    height: 2,
    backgroundColor: "#6B7280",
    transform: [{ rotate: "45deg" }],
  },
  closeLine2: {
    position: "absolute",
    width: 16,
    height: 2,
    backgroundColor: "#6B7280",
    transform: [{ rotate: "-45deg" }],
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  searchCircle: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: "#6B7280",
    borderRadius: 5,
    position: "absolute",
    top: 0,
    left: 0,
  },
  searchHandle: {
    width: 6,
    height: 2,
    backgroundColor: "#6B7280",
    position: "absolute",
    bottom: 0,
    right: 0,
    transform: [{ rotate: "45deg" }],
  },
});