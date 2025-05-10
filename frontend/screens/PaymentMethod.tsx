// app/create-customer.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { CardField, useStripe, CardFieldInput } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import axios from "axios";
const API_URL = 'http://localhost:3000';

export default function CreateCustomerScreen() {
  const { createPaymentMethod } = useStripe();
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState({
    email: '',
    name: '',
    phone: '',
  });
  
  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Method 1: Create a customer without payment method
  const createCustomer = async () => {
    try {
      console.log(customerData.email)
      // Validate email
      if (!customerData.email) {
        console.log('no email found')
      }
      setLoading(true);
      // Call backend to create customer
      console.log(customerData)
      const response = await axios.post(
        `${API_URL}/api/stripe/create-customer`,       // 1. URL
        { customerData },                       // 2. body payload
      );
      
      console.log(response.data)
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Create a customer with payment method
  const createCustomerWithPaymentMethod = async () => {
    try {
      // Validate email
      if (!customerData.email) {
        Alert.alert('Error', 'Email is required');
        return;
      }
      
      // Validate card details
      if (!cardDetails?.complete) {
        Alert.alert('Error', 'Please enter complete card information');
        return;
      }
      
      setLoading(true);
      
      // Create a payment method with the card details
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
          },
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }
      
      // Call backend to create customer with payment method
      const response = await fetch(`${API_URL}/api/create-customer-with-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customerData,
          paymentMethodId: paymentMethod.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer with payment method');
      }
      
      const result = await response.json();
      
      Alert.alert(
        'Success',
        `Customer created with ID: ${result.customer.id} and payment method attached`,
        [{ text: 'OK', onPress: () => router.push('/') }]
      );
    } catch (error) {
      console.error('Error creating customer with payment method:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Stripe Customer</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email (required)</Text>
        <TextInput
          style={styles.input}
          value={customerData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="customer@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={customerData.name}
          onChangeText={(text) => handleInputChange('name', text)}
          placeholder="John Doe"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={customerData.phone}
          onChangeText={(text) => handleInputChange('phone', text)}
          placeholder="+1 (123) 456-7890"
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={customerData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          placeholder="Customer description"
        />
      </View>
      
      <View style={styles.cardSection}>
        <Text style={styles.cardSectionTitle}>Add Payment Method (Optional)</Text>
        <Text style={styles.cardSectionDescription}>
          You can create a customer with or without a payment method
        </Text>
        
        <View style={styles.cardContainer}>
          <CardField
            postalCodeEnabled={true}
            placeholders={{
              number: '4242 4242 4242 4242',
              expiration: 'MM/YY',
              cvc: 'CVC',
              postalCode: '12345',
            }}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#1F2937',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              borderRadius: 8,
            }}
            style={styles.cardField}
            onCardChange={(details) => setCardDetails(details)}
          />
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title="Create Customer"
            onPress={createCustomer}
            color="#2563eb"
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Create Customer with Payment Method"
            onPress={createCustomerWithPaymentMethod}
            color="#059669"
            disabled={!cardDetails?.complete}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="Go Back"
            onPress={() => router.back()}
            color="#6b7280"
          />
        </View>
      )}
      
      <View style={styles.testCardContainer}>
        <Text style={styles.testCardTitle}>Test Card Numbers:</Text>
        <Text style={styles.testCardText}>• 4242 4242 4242 4242 - Success</Text>
        <Text style={styles.testCardText}>• 4000 0025 0000 3155 - 3D Secure</Text>
        <Text style={styles.testCardText}>• 4000 0000 0000 9995 - Decline</Text>
        <Text style={styles.testCardNote}>
          Use any future expiration date, any 3-digit CVC, and any postal code.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#4b5563',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  cardSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1f2937',
  },
  cardSectionDescription: {
    fontSize: 14,
    marginBottom: 15,
    color: '#6b7280',
  },
  cardContainer: {
    width: '100%',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 10,
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  buttonSpacer: {
    height: 15,
  },
  testCardContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  testCardText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
  },
  testCardNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 10,
    fontStyle: 'italic',
  },
});