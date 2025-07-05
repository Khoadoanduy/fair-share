import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VirtualCardDisplayProps {
  cardBrand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  cardholderName?: string;
  cvc?: number;
  number?: number;
}

export default function VirtualCardDisplay({
  cardBrand = "visa",
  expMonth,
  expYear,
  cardholderName,
  number,
  cvc,
}: VirtualCardDisplayProps) {
  return (
    <View style={styles.cardContainer}>
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
          <Text style={styles.cardNumber}>{number}</Text>

          {expMonth && expYear && (
            <Text style={styles.cardExpiry}>
              Expires {expMonth}/{expYear}
            </Text>
          )}

          {cardholderName && (
            <Text style={styles.cardholderName}>{cardholderName}</Text>
          )}

          {cvc && (
            <Text style={styles.cardholderName}>CVC: {cvc}</Text>
          )}
        </View>
        
        <Ionicons name="card-outline" size={24} color="#4A3DE3" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 120,
    paddingTop: 24,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  cardImage: {
    width: 50,
    height: 30,
    resizeMode: "contain",
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
    justifyContent: "flex-start",
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  cardDots: {
    letterSpacing: 1,
    color: "#666",
  },
  cardExpiry: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
});
