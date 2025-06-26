import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface SubscriptionCardProps {
  logo?: any;
  subscriptionName?: string;
  amountEach?: number;
  cycle?: string;
  isShared?: boolean;
  category?: string;
  amount?: number;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  logo,
  subscriptionName,
  amountEach,
  cycle,
  isShared,
  category,
}) => {
  return (
    <View style={styles.subscriptionCard}>
      {logo && <Image source={logo} style={styles.subscriptionLogo} />}
      <View style={styles.subscriptionDetails}>
        {subscriptionName && <Text style={styles.subscriptionName}>{subscriptionName}</Text>}
        <View style={styles.tagsContainer}>
          {isShared && (
            <View style={[styles.tag, { backgroundColor: '#FEC260' }]}>
              <Text style={styles.tagText}>Shared</Text>
            </View>
          )}
          {category && (
            <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
              <Text style={styles.tagText}>{category}</Text>
            </View>
          )}
        </View>
      </View>
      {(amountEach !== undefined || cycle) && (
        <View style={styles.subscriptionRight}>
          {amountEach !== undefined && <Text style={styles.price}>${amountEach}</Text>}
          {cycle && (
            <View style={styles.cycleContainer}>
              <Image source={require('../assets/refresh-cw.png')} style={styles.refreshIcon} />
              <Text style={styles.billingCycle}>{cycle}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionLogo: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: 8,
  },
  subscriptionDetails: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '600',
  },
  subscriptionRight: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cycleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshIcon: {
    width: 14,
    height: 14,
    tintColor: '#6B7280',
  },
  billingCycle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default SubscriptionCard;
