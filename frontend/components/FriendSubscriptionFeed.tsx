import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Hardcoded data for friends' subscriptions
const MOCK_FRIEND_SUBSCRIPTIONS = [
  {
    id: '1',
    friendId: 'user1',
    friendName: 'Alice Johnson',
    username: 'alicej',
    subscriptionName: 'Netflix',
    amount: 15.99,
    cycle: 'monthly',
    groupName: 'Movie Night Group',
    joinedDate: '2025-05-15',
    avatarColor: '#FF5733'
  },
  {
    id: '2',
    friendId: 'user2',
    friendName: 'Bob Smith',
    username: 'bobsmith',
    subscriptionName: 'Spotify Family',
    amount: 12.99,
    cycle: 'monthly',
    groupName: 'Music Lovers',
    joinedDate: '2025-06-22',
    avatarColor: '#33A8FF'
  },
  {
    id: '3',
    friendId: 'user3',
    friendName: 'Emma Davis',
    username: 'emmad',
    subscriptionName: 'Disney+',
    amount: 7.99,
    cycle: 'monthly',
    groupName: 'Family Entertainment',
    joinedDate: '2025-5-22',
    avatarColor: '#9333FF'
  },
  {
    id: '4',
    friendId: 'user4',
    friendName: 'Michael Wilson',
    username: 'mikew',
    subscriptionName: 'YouTube Premium',
    amount: 11.99,
    cycle: 'monthly',
    groupName: 'Content Creators',
    joinedDate: '2025-01-01',
    avatarColor: '#33FF57'
  }
];

// Get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

// Format date to relative time
const formatDate = (dateString: string | number | Date) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    // Past dates
    const absDiff = Math.abs(diffInDays);
    if (absDiff === 0) return 'Today';
    if (absDiff === 1) return 'Yesterday';
    if (absDiff < 7) return `${absDiff} days ago`;
  } else if (diffInDays > 0) {
    // Future dates
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} days`;
  }

  return date.toLocaleDateString();
};

interface Props {
  userId: string;
}

const FriendSubscriptionFeed = ({ userId }: Props) => {
  // In a real app, you'd fetch data based on userId
  // For now, we'll just use the hardcoded data

  return (
    <View style={styles.container}>
      {MOCK_FRIEND_SUBSCRIPTIONS.length === 0 ? (
        <Text style={styles.emptyText}>No friend activity yet</Text>
      ) : (
        <FlatList
          data={MOCK_FRIEND_SUBSCRIPTIONS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
                  <Text style={styles.initials}>{getInitials(item.friendName)}</Text>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{item.friendName}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
              </View>

              <Text style={styles.activity}>
                joined <Text style={styles.highlight}>{item.subscriptionName}</Text> in group{' '}
                <Text style={styles.highlight}>{item.groupName}</Text>
              </Text>

              <View style={styles.footer}>
                <View style={styles.subscriptionInfo}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>{item.cycle}</Text>
                </View>
                <View style={styles.subscriptionInfo}>
                  <Ionicons name="cash-outline" size={14} color="#666" />
                  <Text style={styles.infoText}>${item.amount.toFixed(2)}</Text>
                </View>
                <Text style={styles.date}>{formatDate(item.joinedDate)}</Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: '#666',
    fontSize: 13,
  },
  activity: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  highlight: {
    fontWeight: '600',
    color: '#4353FD',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
});

export default FriendSubscriptionFeed;