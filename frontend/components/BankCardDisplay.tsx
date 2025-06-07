import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface PaymentMethodCardProps {
  cardBrand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export default function BankCardDisplay({ 
  cardBrand, 
  last4, 
  expMonth, 
  expYear 
}: PaymentMethodCardProps) {
  return (
    <View style={styles.paymentMethodItem}>
      <Image
        source={
          cardBrand === "visa"
            ? require("../assets/images/visa-240.png")
            : require("../assets/images/mastercard-240.png")
        }
        style={styles.cardImage}
      />
      <View style={styles.paymentMethodDetails}>
        <Text style={styles.paymentMethodText}>
          <Text style={styles.cardDots}>....</Text> {last4}
        </Text>
        <Text style={styles.paymentMethodExpiry}>
          Expires {expMonth}/{expYear}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardImage: {
    width: 40,
    height: 24,
    resizeMode: "contain",
    marginRight: 8,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    marginTop: 4,
    flex: 1,
  },
  cardDots: {
    fontSize: 20,
    letterSpacing: 3,
    fontWeight: "bold",
    color: "black",
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: "500",
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
});