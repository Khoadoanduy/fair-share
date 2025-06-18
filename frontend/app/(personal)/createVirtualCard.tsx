import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '@/components/CustomButton';
import ProgressDots from '@/components/ProgressDots';
import axios from 'axios';
import { useUser } from '@clerk/clerk-expo';

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

export default function CreateVirtualCardScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const { user } = useUser();
  const router = useRouter();
  const { subscriptionId, nextScreen } = useLocalSearchParams();
  const [virtualCard, setVirtualCard] = useState<VirtualCard | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch subscription data to get service name
    const fetchSubscriptionData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/personal-subscription/${subscriptionId}`);
        setSubscriptionData(response.data);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };

    fetchSubscriptionData();
    createVirtualCard();
  }, []);

  const createVirtualCard = async () => {
    try {
      setLoading(true);

      // Get user's MongoDB ID
      const userResponse = await axios.get(`${API_URL}/api/user/`, {
        params: { clerkID: user?.id },
      });
      const mongoUserId = userResponse.data.id;

      // Create virtual card for personal subscription
      const response = await axios.post(`${API_URL}/api/virtualCard/create`, {
        customerId: userResponse.data.customerId,
        personalSubscriptionId: subscriptionId, // Change subscriptionId to personalSubscriptionId
      });

      if (response.data.success) {
        // Get the created card details
        const cardResponse = await axios.get(`${API_URL}/api/virtualCard/get`, {
          params: { stripeId: userResponse.data.customerId },
        });

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
            currency: latestCard.currency
          });
        }
      }
    } catch (error) {
      console.error('Error creating virtual card:', error);
      Alert.alert('Error', 'Failed to create virtual card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCardNumber = () => {
    if (virtualCard) {
      // In a real app, you'd copy to clipboard
      Alert.alert('Copied', 'Card number copied to clipboard');
    }
  };

  const handleCopySecurityCode = () => {
    Alert.alert('Copied', 'Security code copied to clipboard');
  };

  const handleNext = () => {
    router.push({
      pathname: '/(personal)/addAccountCredentials',
      params: {
        subscriptionId,
        hasVirtualCard: 'true',
      },
    });
  };

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
        <Text style={styles.title}>Subscribe with{'\n'}your virtual card</Text>

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
                    {`${virtualCard.last4.slice(0, 4)} ${virtualCard.last4.slice(0, 4)} ${virtualCard.last4.slice(0, 4)} ${virtualCard.last4}`}
                  </Text>
                  <Pressable onPress={handleCopyCardNumber} style={styles.copyButton}>
                    <Ionicons name="copy-outline" size={20} color="white" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.cardDetailsRow}>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>Expiration date</Text>
                  <Text style={styles.cardDetailValue}>
                    {virtualCard.expMonth}/{virtualCard.expYear.toString().slice(-2)}
                  </Text>
                </View>
                <View style={styles.cardDetailItem}>
                  <Text style={styles.cardDetailLabel}>Security code</Text>
                  <View style={styles.securityCodeRow}>
                    <Text style={styles.cardDetailValue}>123</Text>
                    <Pressable onPress={handleCopySecurityCode} style={styles.copyButton}>
                      <Ionicons name="copy-outline" size={16} color="white" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>
            Tap the copy button next to your virtual card number and security code to use them.
          </Text>

          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open <Text style={styles.boldText}>{subscriptionData?.subscriptionName || 'the service'}</Text> in your browser or app and go to the payment or subscription page.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Paste the copied card details into the payment fields. Ensure all fields match.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Container with Progress Dots and Button */}
      <View style={styles.bottomContainer}>
        <ProgressDots totalSteps={4} currentStep={3} />
        <CustomButton
          text="Next - Update account credentials"
          onPress={handleNext}
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
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4A3DE3',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 36,
  },
  cardContainer: {
    backgroundColor: '#4A3DE3',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  virtualBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  virtualBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cardBody: {
    gap: 24,
  },
  cardNumberSection: {
    gap: 8,
  },
  cardNumberLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  cardNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 4,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetailItem: {
    gap: 4,
  },
  cardDetailLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  cardDetailValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  securityCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionsContainer: {
    gap: 24,
    marginBottom: 20, // Reduced from 40
  },
  instructionsTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepContainer: {
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#4A3DE3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 20,
    backgroundColor: 'white', // Ensure white background
  },
  nextButton: {
    backgroundColor: '#4A3DE3',
    borderRadius: 12,
    paddingVertical: 16,
  },
});