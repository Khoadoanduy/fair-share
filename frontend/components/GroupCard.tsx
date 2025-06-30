import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface GroupCardProps {
  group: {
    id: string;
    groupName: string;
    subscriptionName: string;
    planName?: string;
    amountEach: number;
    cycle: string;
    category: string;
    logo?: string;
    isPersonal?: boolean;
    totalMem?: number;
    endDate?: string; // Added endDate to group object
  };
  onPress: () => void;
}

// Function to format the relative date for next payment
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));

  if (days < 0) {
    return "now";
  } else if (days === 0) {
    return "today";
  } else if (days === 1) {
    return "tomorrow";
  } else {
    return `in ${days} days`;
  }
};

const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  return (
    <Pressable style={styles.subscriptionCard} onPress={onPress}>
      {/* Use real logo or fallback to placeholder */}
      {group.logo ? (
        <Image source={{ uri: group.logo }} style={styles.subscriptionLogo} />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>{group.subscriptionName.charAt(0)}</Text>
        </View>
      )}

      <View style={styles.subscriptionDetails}>
        <Text style={styles.subscriptionName}>{group.subscriptionName}</Text>
        {group.planName && (
          <Text style={styles.planName}>{group.planName}</Text>
        )}

        <View style={styles.tagsContainer}>
          {/* Show correct type tag */}
          <View style={[styles.tag, { backgroundColor: group.isPersonal ? '#6C63FF' : '#FEC260' }]}>
            <Text style={[styles.tagText, { color: group.isPersonal ? 'white' : 'black' }]}>
              {group.isPersonal ? 'Personal' : 'Shared'}
            </Text>
          </View>

          {/* Show category tag */}
          {group.category && (
            <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
              <Text style={[styles.tagText, { color: 'white' }]}>{group.category}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.subscriptionRight}>
        <Text style={styles.price}>${group.amountEach.toFixed(2)}</Text>
        <View style={styles.cycleContainer}>
          <Ionicons name="refresh-outline" size={14} color="#6B7280" />
          <Text style={styles.billingCycle}>{group.cycle}</Text>
        </View>

        {/* Show member count for shared subscriptions */}
        {!group.isPersonal && group.totalMem && (
          <Text style={styles.memberCount}>{group.totalMem} members</Text>
        )}

        {/* Show next payment for groups with endDate */}
        {!group.isPersonal && group.endDate && (
          <Text style={styles.nextPaymentText}>
            Due {formatRelativeDate(group.endDate)}
          </Text>
        )}
      </View>
    </Pressable>
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
  logoPlaceholder: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: '#4A3DE3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
  planName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cycleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billingCycle: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  nextPaymentText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
});

export default GroupCard;