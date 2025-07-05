import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

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
  expMonth,
  expYear,
  cardholderName,
  number,
  cvc,
}: VirtualCardDisplayProps) {
  const handleCopyCardNumber = async (number: number) => {
    await Clipboard.setStringAsync(number.toString());
    alert("Copied card number");
  };

  const handleCopySecurityCode = async (cvc: number) => {
    await Clipboard.setStringAsync(cvc.toString());
    alert("Copied security code");
  };
  return (
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
            <Text style={styles.cardNumber}>{number}</Text>
            <Pressable
              onPress={() => handleCopyCardNumber(number)}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color="white" />
            </Pressable>
          </View>
          <Text style={styles.cardNumberLabel}>Card Holder Name</Text>
          <View style={styles.cardNumberRow}>
            <Text style={styles.cardNumber}>{cardholderName}</Text>
          </View>
        </View>

        <View style={styles.cardDetailsRow}>
          <View style={styles.cardDetailItem}>
            <Text style={styles.cardDetailLabel}>Expiration date</Text>
            <Text style={styles.cardDetailValue}>
              {expMonth}/{expYear}
            </Text>
          </View>
          <View style={styles.cardDetailItem}>
            <Text style={styles.cardDetailLabel}>Security code</Text>
            <View style={styles.securityCodeRow}>
              <Text style={styles.cardDetailValue}>{cvc}</Text>
              <Pressable
                onPress={() => handleCopySecurityCode(cvc)}
                style={styles.copyButton}
              >
                <Ionicons name="copy-outline" size={16} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#4A3DE3",
    borderRadius: 16,
    padding: 24,
    marginBottom: 10,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  virtualBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  virtualBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  cardBody: {
    gap: 24,
  },
  cardNumberSection: {
    gap: 8,
  },
  securityCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardNumberLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  cardNumberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
  },
  copyButton: {
    padding: 4,
  },
  cardDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDetailItem: {
    gap: 4,
  },
  cardDetailLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  cardDetailValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
