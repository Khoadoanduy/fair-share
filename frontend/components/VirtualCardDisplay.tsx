import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface VirtualCardDisplayProps {
  cardBrand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  cardholderName?: string;
}

export default function VirtualCardDisplay({ 
  cardBrand = "visa", 
  last4 = "****", 
  expMonth, 
  expYear,
  cardholderName
}: VirtualCardDisplayProps) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.virtualCardLabel}>Virtual Card</Text>
        <Ionicons name="card-outline" size={24} color="#4A3DE3" />
      </View>
      
      <View style={styles.cardBody}>
        <Image
          source={
            cardBrand.toLowerCase() === "visa"
              ? require("../assets/images/visa-240.png")
              : require("../assets/images/mastercard-240.png")
          }
          style={styles.cardImage}
        />
        
        <View style={styles.cardDetails}>
          <Text style={styles.cardNumber}>
            <Text style={styles.cardDots}>•••• •••• •••• </Text>
            {last4}
          </Text>
          
          {(expMonth && expYear) && (
            <Text style={styles.cardExpiry}>
              Expires {expMonth}/{expYear}
            </Text>
          )}
          
          {cardholderName && (
            <Text style={styles.cardholderName}>
              {cardholderName}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  virtualCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3DE3',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 50,
    height: 30,
    resizeMode: 'contain',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  cardDots: {
    letterSpacing: 1,
    color: '#666',
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
});