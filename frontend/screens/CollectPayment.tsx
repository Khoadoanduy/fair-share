import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView, SafeAreaView} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import axios from "axios";
const API_URL = 'http://localhost:3000';
    
export default function CollectPaymentScreen() {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    
    const fetchPaymentSheetParams = async () => {
        try {
            const response = await axios.post(`${API_URL}/api/stripe/payment-sheet`, {});
            const { setupIntent, ephemeralKey, customer} = response.data; 
            return {
                setupIntent,
                ephemeralKey,
                customer
            };
        }
        catch (error) {
            console.error("Error fetching payment sheet params:", error);
            Alert.alert("Error", "Could not connect to payment service");
            return null; // Return null to handle the error case
        }
    };
    
    const initializePaymentSheet = async () => {
        try {
            setLoading(true);
            console.log("hello, I'm at initializePayment");
            const params = await fetchPaymentSheetParams();
            console.log("params from fetchPaymentSheet",params)

            if (!params) {
                throw new Error("Stripe params are missing");
              }
              
            const { setupIntent, ephemeralKey, customer} = params;
            
            const { error } = await initPaymentSheet({
                merchantDisplayName: "FairShare",
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                setupIntentClientSecret: setupIntent,
              });
        } catch (error) {
            console.error("Unexpected error during initialization:", error);
            Alert.alert("Error", "An unexpected error occurred");
        }
        finally {
            setLoading(false);
        }
    };
    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();
    
        if (error) {
          Alert.alert(`Error code: ${error.code}`, error.message);
        } else {
          Alert.alert('Success', 'Your payment method was successfully saved!');
        }
    };
    useEffect(() => {
        initializePaymentSheet();
    }, []);

    
    
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Add Payment Method</Text>
                <Text style={styles.description}>
                    Set up a payment method to use with FairShare
                </Text>
                
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
                ) : (
                    <Button
                        title="Set up payment method"
                        onPress={openPaymentSheet}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
        color: '#666',
    },
    loader: {
        marginVertical: 20,
    },
});