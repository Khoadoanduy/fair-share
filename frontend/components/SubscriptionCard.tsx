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
    virtualCardId?: string;
    status?: 'Active' | 'Inactive' | 'Pending';
  };
  logo?: any; // fallback for simple usage
  subscriptionName?: string;
  amountEach?: number;
  cycle?: string;
  category?: string;
  amount?: number;
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
  return `In ${days} days`;
};

const SubscriptionCard: React.FC<SubscriptionCardProps> = (props) => {
  const group = props.group;
  const logo = group?.logo || props.logo;
  const subscriptionName = group?.subscriptionName || props.subscriptionName;
  const planName = group?.planName;
  const amountEach = group?.amountEach !== undefined ? group.amountEach : props.amountEach;
  const cycle = group?.cycle || props.cycle;
  const category = group?.category || props.category;
  const isPersonal = group?.isPersonal ?? false;
  const totalMem = group?.totalMem;
  const endDate = group?.endDate;
  const virtualCardId = group?.virtualCardId;
  const status = group?.status || 'Active';
  const onPress = props.onPress;

  const CardContent = (
    <View style={styles.subscriptionCard}>
      {/* Left section */}
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
        <View style={styles.topRow}>
          {/* Due date */}
          {endDate && (
            <Text style={styles.dueDate}>{formatRelativeDate(endDate)}</Text>
          )}
        </View>
        <View style={styles.middleRow}>
        {/* Subscription name */}
        {subscriptionName && (
          <Text style={styles.subscriptionName}>{subscriptionName}</Text>
        )}
        </View>

        <View style={styles.bottomRow}>
        {/* Tags row */}
        <View style={styles.tagsRow}>
          {/* Personal/Shared indicator */}
          <View style={styles.personalTag}>
            <Ionicons 
              name={isPersonal ? "person-outline" : "people-outline"} 
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
      <View style={styles.topRow}>
        {/* Billing cycle */}
        {cycle && (
          <Text style={styles.cycleText}>{cycle}</Text>
        )}
      </View>
      <View style={styles.middleRow}>
        {/* Price */}
        {amountEach !== undefined && amountEach !== null && (
          <Text style={styles.price}>${amountEach.toFixed(2)}</Text>
        )}
       </View>
       <View style={styles.bottomRow}>
        {/* Status */}
        <View style={[styles.statusTag, status === 'Active' ? styles.statusTagActive : styles.statusTagInactive]}>
            <Text style={[styles.statusText, status === 'Active' ? styles.statusTextActive : styles.statusTextInactive]}>
              {status}
            </Text>
          </View>
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
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    width: 56,
    height: 56,
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
  },
  topRow: {
    height: 20,
    justifyContent: 'center',
  },
  middleRow: {
    height: 28,
    justifyContent: 'center',
  },
  bottomRow: {
    height: 28,
    justifyContent: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  subscriptionName: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000',
    marginBottom: 8,
    fontStyle: 'normal',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personalTag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  virtualCardTag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cycleText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 18,
    fontWeight: '400',
    color: '#111827',
    marginBottom: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagActive: {
    backgroundColor: '#D1FAE5',
  },
  statusTagInactive: {
    backgroundColor: '#E9F9F3',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusTextActive: {
    color: '#027A48',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
});

export default SubscriptionCard;
