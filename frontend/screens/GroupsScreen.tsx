import CustomButton from '@/components/CustomButton';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Image, FlatList, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router'; 
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton';

interface Group {
  id: string;
  groupName: string;
  subscriptionName: string;
  subscriptionId?: string;
  planName?: string;
  amount: number;
  cycle: string;
  category: string;
}

export default function GroupsScreen() {
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { user } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const clerkId = user?.id;

  const handleCreateGroup = () => {
    router.push('/(group)/createGroupName')
  }

  const showAllInvitations = () => {
    router.push('/(group)/showAllInvitations')
  }

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/user/`, {
          params: { clerkID: clerkId },
        });
        setUserId(response.data.id);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (clerkId) {
      fetchUserId();
    }
  }, [clerkId]);

  const fetchGroups = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/api/user/groups/${userId}`);
      // The groups are nested in the response as group property
      const transformedGroups = response.data.map((item: any) => ({
        id: item.group.id,
        groupName: item.group.groupName,
        subscriptionName: item.group.subscriptionName,
        subscriptionId: item.group.subscriptionId,
        planName: item.group.planName,
        amount: item.group.amount,
        cycle: item.group.cycle,
        category: item.group.category
      }));
      setGroups(transformedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchGroups();
    }
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton></BackButton>
        <Text style={styles.headerTitle}>Manage Subscriptions</Text>
        <Ionicons name="search" size={20} color="#4A3DE3" />
      </View>
      <View style={styles.toggleContainer}>
        <Pressable style={styles.toggleBtnActive}>
          <Text style={styles.toggleTextActive}>My Subscriptions</Text>
        </Pressable>
        <Pressable style={styles.toggleBtnInactive} onPress={showAllInvitations}>
          <Text style={styles.toggleTextInactive}>Pending</Text>
        </Pressable>
      </View>
      <View style={styles.filterContainer}>
        {['All', 'Personal', 'Shared'].map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={selectedFilter === 'Personal' ? [] : groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.subscriptionCard}>
            <Image source={require('../assets/spotify.png')} style={styles.subscriptionLogo} />
            <View style={styles.subscriptionDetails}>
              <Text style={styles.subscriptionName}>{item.subscriptionName}</Text>
              <View style={styles.tagsContainer}>
                <View style={[styles.tag, { backgroundColor: '#FEC260' }]}>
                  <Text style={styles.tagText}>Shared</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.tagText}>{item.category}</Text>
                </View>
              </View>
            </View>
            <View style={styles.subscriptionRight}>
              <Text style={styles.price}>${item.amount}</Text>
              <View style={styles.cycleContainer}>
                <Image source={require('../assets/refresh-cw.png')} style={styles.refreshIcon} />
                <Text style={styles.billingCycle}>{item.cycle}</Text>
              </View>
            </View>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={handleCreateGroup}>
        <Ionicons name="add" size={24} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A3DE3',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: 10,
    backgroundColor: '#4A3DE31A',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 20,
    marginVertical: 16,
  },
  toggleBtnActive: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: -25
  },
  toggleBtnInactive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignContent: 'center'
  },
  toggleTextActive: {
    color: 'black',
    fontWeight: '600',
  },
  toggleTextInactive: {
    color: '#6B7280',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: '#4A3DE31A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#4A3DE3',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A3DE3',
  },
  activeFilterText: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
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
  refreshIcon: {
    width: 14,
    height: 14,
    tintColor: '#6B7280',
  },
  billingCycle: {
    fontSize: 12,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A3DE3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});