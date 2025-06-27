// components/GroupHeader.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type GroupHeaderProps = {
  groupName: string;
  amountEach?: number;
  daysUntilNextPayment?: number;
  showShare?: boolean;
  showPayment?: boolean;
};
const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupName,
  amountEach,
  daysUntilNextPayment,
  showShare,
  showPayment,
}) => {
  return (
    <View style={styles.topCard}>
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed-outline" size={24} color="#4353ED" />
        <Text style={styles.groupName}>{groupName}</Text>
      </View>

      <View style={styles.infoCardsContainer}>
        <View style={styles.infoCard}>
            <View style={styles.labelContainer}>
              <Text style={styles.infoLabel}>Your Share</Text>
              <Ionicons name="pie-chart-outline" size={20} color="#000" />
            </View>
            <View style={styles.infoValueContainer}>
                {showShare ? <Text style={styles.infoValue}>${amountEach}</Text> : <View style={styles.placeholderBox} />}
            </View>
        </View>
        
        <View style={styles.infoCard}>
            <View style={styles.labelContainer}>
              <Text style={styles.infoLabel}>Payment In</Text>
              <Ionicons name="time-outline" size={20} color="#000" />
            </View>
            <Text style={styles.infoValueContainer}>
              {daysUntilNextPayment? <Text style={styles.infoValue}>{daysUntilNextPayment} days</Text> : <View style={styles.placeholderBox} />}
            </Text>
          </View>
        </View>
    </View>
  );
};

export default GroupHeader;

const styles = StyleSheet.create({
  topCard: {
    backgroundColor: "#4A3DE31A",
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 24,
    padding: 15,
  },
  lockContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  groupName: {
    fontSize: 32,
    fontWeight: "600",
    color: "#4A3DE3",
    marginLeft: 12,
    textAlign: "center",
  },
  infoCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#FCFBFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#4A3DE3",
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeholderBox: {
    width: 80,
    height: 30,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
});