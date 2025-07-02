import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionCardProps {
  group?: {
    id: string;
    groupName: string;
    subscriptionName: string;
    planName?: string;
    amountEach?: number;
    cycle?: string;
    category?: string;
    logo?: string;
    isPersonal?: boolean;
    totalMem?: number;
    endDate?: string; 
    showNegativeAmount?: boolean;
    timestamp?: string;
  };
  logo?: any; // fallback for simple usage
  subscriptionName?: string;
  amountEach?: number;
  cycle?: string;
  isShared?: boolean;
  category?: string;
  onPress?: () => void;
}

// Helper to format relative date
const formatRelativeDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  if (days < 0) return "now";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = (props) => {
  const group = props.group;
  const logo = group?.logo || props.logo;
  const subscriptionName = group?.subscriptionName || props.subscriptionName;
  const planName = group?.planName;
  const amountEach = group?.amountEach !== undefined ? group.amountEach : props.amountEach;
  const cycle = group?.cycle || props.cycle;
  const category = group?.category || props.category;
  const isPersonal = group?.isPersonal;
  const isShared = props.isShared !== undefined ? props.isShared : !isPersonal;
  const totalMem = group?.totalMem;
  const endDate = group?.endDate;
  const onPress = props.onPress;

  const CardContent = (
    <View style={styles.subscriptionCard}>
      {/* Logo or fallback */}
      {logo ? (
        typeof logo === 'string' ? (
          <Image source={{ uri: logo }} style={styles.subscriptionLogo} />
        ) : (
          <Image source={logo} style={styles.subscriptionLogo} />
        )
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>{subscriptionName ? subscriptionName.charAt(0) : '?'}</Text>
        </View>
      )}
      <View style={styles.subscriptionDetails}>
        {subscriptionName && <Text style={styles.subscriptionName}>{subscriptionName}</Text>}
        {planName && <Text style={styles.planName}>{planName}</Text>}
        <View style={styles.tagsContainer}>
          {/* Type tag */}
          {isPersonal !== undefined && (
            <View style={[styles.tag, { backgroundColor: isPersonal ? '#6C63FF' : '#FEC260' }]}>
              <Text style={[styles.tagText, { color: isPersonal ? 'white' : 'black' }]}>
                {isPersonal ? 'Personal' : 'Shared'}
              </Text>
            </View>
          )}
          {category && (
            <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
              <Text style={[styles.tagText, { color: 'white' }]}>{category}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.subscriptionRight}>
        {amountEach !== undefined && amountEach !== null ? (
          <Text style={styles.price}>${amountEach.toFixed(2)}</Text>
        ) : null}
        {cycle && (
          <View style={styles.cycleContainer}>
            <Ionicons name="refresh-outline" size={14} color="#6B7280" />
            <Text style={styles.billingCycle}>{cycle}</Text>
          </View>
        )}
        {/* Show member count for shared subscriptions */}
        {isPersonal === false && totalMem && (
          <Text style={styles.memberCount}>{totalMem} members</Text>
        )}
        {/* Show next payment for groups with endDate */}
        {isPersonal === false && endDate && (
          <Text style={styles.nextPaymentText}>Due {formatRelativeDate(endDate)}</Text>
        )}
      </View>
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress}>{CardContent}</Pressable>
  ) : (
    CardContent
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
    fontWeight: '700',
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

export default SubscriptionCard;
