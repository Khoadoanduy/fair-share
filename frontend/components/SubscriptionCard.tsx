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
    isShared?: boolean;
    totalMem?: number;
    endDate?: string; 
    showNegativeAmount?: boolean;
    timestamp?: string;
    virtualCardId?: string;
    status?: string; // Added for Active/Inactive status
  };
  logo?: any;
  subscriptionName?: string;
  amountEach?: number;
  cycle?: string;
  category?: string;
  amount?: number;
  status?: string;
  endDate?: string;
  isShared?: boolean;
  showNegativeAmount?: boolean;
  timestamp?: string;
  onPress?: () => void;
}

// Helper to format relative date
const formatRelativeDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  if (days < 0) return "Due now";
  if (days === 0) return "Due today";
  if (days === 1) return "In 1 day";
  return `In ${days} days`;
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = (props) => {
  const group = props.group;
  const logo = group?.logo || props.logo;
  const subscriptionName = group?.subscriptionName || props.subscriptionName;
  const amountEach = group?.amountEach !== undefined ? group.amountEach : props.amountEach;
  const cycle = group?.cycle || props.cycle;
  const category = group?.category || props.category;
  const isShared = group?.isShared ?? props.isShared ?? true;
  const endDate = group?.endDate || props.endDate;
  const status = group?.status || props.status || 'Active';
  const showNegativeAmount = group?.showNegativeAmount ?? props.showNegativeAmount ?? false;
  const timestamp = group?.timestamp || props.timestamp;
  const onPress = props.onPress;

  const CardContent = (
    <View style={styles.subscriptionCard}>
      {/* Left side with logo */}
      <View style={styles.leftSection}>
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
      </View>

      {/* Middle section */}
      <View style={styles.middleSection}>
        {/* Top row - Due date */}
        <View style={styles.topRow}>
          {endDate && !showNegativeAmount && (
            <Text style={styles.dueDate}>{formatRelativeDate(endDate)}</Text>
          )}
        </View>
        
        {/* Middle row - Subscription name */}
        <View style={styles.middleRow}>
          {subscriptionName && (
            <Text style={styles.subscriptionName}>{subscriptionName}</Text>
          )}
        </View>
        
        {/* Bottom row - Tags */}
        <View style={styles.bottomRow}>
          <View style={styles.tagsRow}>
            {/* Personal/Shared indicator */}
            <View style={styles.personalTag}>
              <Ionicons 
                name={isShared ? "people-outline" : "person-outline"} 
                size={16} 
                color="#6366F1" 
              />
            </View>
            
            {/* Virtual card indicator */}
            {group?.virtualCardId && (
              <View style={styles.virtualCardTag}>
                <Ionicons name="card-outline" size={16} color="#6366F1" />
              </View>
            )}
            
            {/* Category tag */}
            {category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        {/* Top row - Billing cycle */}
        <View style={styles.topRow}>
          {cycle && !showNegativeAmount && (
            <Text style={styles.cycleText}>{cycle}</Text>
          )}
        </View>
        
        {/* Middle row - Price */}
        <View style={styles.middleRow}>
          {amountEach !== undefined && amountEach !== null && (
            <Text style={styles.price}>
              {showNegativeAmount ? '-' : ''}${amountEach.toFixed(2)}
            </Text>
          )}
        </View>
        
        {/* Bottom row - Status or Timestamp */}
        <View style={styles.bottomRow}>
          {showNegativeAmount && timestamp ? (
            <Text style={styles.timestampText}>{timestamp}</Text>
          ) : (
            <View style={[styles.statusTag, status === 'Active' ? styles.statusTagActive : styles.statusTagInactive]}>
              <Text style={[styles.statusText, status === 'Active' ? styles.statusTextActive : styles.statusTextInactive]}>
                {status}
              </Text>
            </View>
          )}
        </View>
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftSection: {
    marginRight: 16,
  },
  subscriptionLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personalTag: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  virtualCardTag: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTag: {
    height: 28,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cycleText: {
    fontSize: 14,
    color: '#9CA3AF',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusTag: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
  },
  statusTagActive: {
    backgroundColor: '#D1FAE5',
  },
  statusTagInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#065F46',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
});

export default SubscriptionCard;