import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useUser } from '@clerk/clerk-expo';
import { useAppDispatch } from '@/redux/hooks';
import { setHasPayment } from '@/redux/slices/userSlice';
import axios from 'axios';

const API_URL = "http://localhost:3000";

export default function StripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const dispatch = useAppDispatch();
  const clerkId = user?.id;

  const fetchPaymentSheetParams = async () => {
    try {
      const customerInfo = user?.primaryEmailAddress?.emailAddress;
      const response = await axios.post(`${API_URL}/api/stripe/payment-sheet`, {
        customerInfo,
      });
      const { setupIntent, ephemeralKey, customer } = response.data;
      
      // Update user with Stripe customer ID
      await axios.put(`${API_URL}/api/user/${clerkId}/${customer}`);

      return { setupIntent, ephemeralKey, customer };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      Alert.alert("Error", "Could not connect to payment service");
      return null;
    }
  };

  const initializePaymentSheet = async () => {
    try {
      const params = await fetchPaymentSheetParams();
      if (!params) return false;

      const { error } = await initPaymentSheet({
        merchantDisplayName: "FairShare",
        customerId: params.customer,
        customerEphemeralKeySecret: params.ephemeralKey,
        setupIntentClientSecret: params.setupIntent,
      });

      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      console.error("Error initializing payment sheet:", error);
      Alert.alert("Error", "Failed to initialize payment");
      return false;
    }
  };

  const handlePaymentSetup = async () => {
    try {
      setLoading(true);
      const initialized = await initializePaymentSheet();
      if (!initialized) return;

      const { error } = await presentPaymentSheet();
      if (error) {
        Alert.alert("Error", error.message || "Payment failed");
      } else {
        dispatch(setHasPayment(true));
        Alert.alert("Success", "Your payment method was set up successfully");
      }
    } catch (error) {
      console.error("Error in payment setup:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set Up Payment Method</Text>
        <Text style={styles.description}>
          Add a payment method to start sharing subscriptions with others.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePaymentSetup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Setting up..." : "Set Up Payment Method"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});