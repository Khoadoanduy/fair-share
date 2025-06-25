import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useUserState } from '@/hooks/useUserState';
import GroupCard from '@/components/GroupCard';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Transaction {
  id: string;
  amount: number;
  created: number;
  status: string;
  metadata?: {
    groupId?: string;
  };
}

interface Group {
  id: string;
  groupName: string;
  subscriptionName: string;
  subscriptionId?: string;
  category: string;
  subscription?: {
    logo?: string;
    category?: string;
  };
  totalMem: number;
}

interface EnrichedTransaction extends Transaction {
  groupData?: Group;
  subscriptionName?: string;
  category?: string;
  logo?: string | null;
  isShared?: boolean;
}

interface GroupedTransactions {
  [date: string]: EnrichedTransaction[];
}

type FilterType = 'all' | 'personal' | 'shared';

const HistoryScreen = () => {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const user = useUserState();

  const groupTransactionsByDate = (transactions: EnrichedTransaction[]): GroupedTransactions => {
    const grouped: GroupedTransactions = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.created * 1000);
      transactionDate.setHours(0, 0, 0, 0);

      let dateKey;
      if (transactionDate.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else {
        const day = transactionDate.getDate();
        const month = transactionDate.toLocaleDateString('en-US', { month: 'short' });
        dateKey = `${day} ${month}`;
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    const sortedGrouped: GroupedTransactions = {};
    Object.keys(grouped)
      .sort((a, b) => {
        if (a === 'Today') return -1;
        if (b === 'Today') return 1;
        const dateA = new Date(grouped[a][0].created * 1000);
        const dateB = new Date(grouped[b][0].created * 1000);
        return dateB.getTime() - dateA.getTime();
      })
      .forEach((key) => {
        sortedGrouped[key] = grouped[key];
      });

    return sortedGrouped;
  };

  const fetchTransactions = async () => {
    try {
      const transactionsResponse = await axios.get(`${API_URL}/api/stripe-payment/transactions`, {
        params: { customerStripeID: user.stripeCustomerId },
      });

      // Enrich transactions with group data
      const enrichedTransactions = await Promise.all(
        transactionsResponse.data.map(async (transaction: Transaction) => {
          try {
            if (transaction.metadata?.groupId) {
              // Fetch group data including subscription relation
              console.log(transaction.metadata.groupId)
              const res = await axios.get(`${API_URL}/api/group/${transaction.metadata.groupId}`);
              const group: Group = res.data;

              // console.log(group);

              // console.log(group.subscriptionId)
              
              return {
                ...transaction,
                groupData: group,
                subscriptionName: group.subscriptionName,
                category: group.subscription?.category || group.category,
                logo: group.subscription?.logo || null,
                isShared: group.totalMem > 1,
              };
            }
          } catch (err) {
            console.error(`Failed to fetch group data for transaction ${transaction.id}`, err);
          }
          
          // Return transaction without enrichment if no groupId or if fetch failed
          return {
            ...transaction,
            subscriptionName: 'Unknown Subscription',
            category: 'Other',
            logo: null,
            isShared: false,
          };
        })
      );
      
      // Extract unique categories from enriched transactions
      const uniqueCategories = [...new Set(enrichedTransactions
        .map((t) => t.category)
        .filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      
      setTransactions(enrichedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkId && user?.stripeCustomerId) {
      fetchTransactions();
    }
  }, [clerkId, user?.stripeCustomerId]);

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      // Filter by type (personal/shared)
      if (filterType !== 'all') {
        if (filterType === 'shared' && !transaction.isShared) return false;
        if (filterType === 'personal' && transaction.isShared) return false;
      }

      // Filter by category
      if (categoryFilter !== 'all' && transaction.category !== categoryFilter) return false;

      return true;
    });
  };

  const renderTransaction = (transaction: EnrichedTransaction) => {
    const amount = transaction.amount / 100;
    const name = transaction.subscriptionName || 'Subscription';
    const createdAt = new Date(transaction.created * 1000);
    const formattedDateTime = createdAt.toLocaleString('en-US', {
      timeStyle: 'short',
    });

    return (
      <View key={transaction.id}>
        <GroupCard
          logo={transaction.logo ? { uri: transaction.logo } : null}
          subscriptionName={name}
          amountEach={amount}
          isShared={transaction.isShared}
          category={transaction.category}
          showNegativeAmount={true}
          timestamp={formattedDateTime}
        />
      </View>
    );
  };

  const renderFilters = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowFilters(false)}
      >
        <View style={styles.filterModal}>
          <View style={styles.filterHandle} />
          <Text style={styles.filterTitle}>Filters</Text>

          {/* Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Type</Text>
            <View style={styles.filterOptions}>
              {(['all', 'personal', 'shared'] as FilterType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterOption,
                    filterType === type && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filterType === type && styles.filterOptionTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Filter */}
          {categories.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      categoryFilter === 'all' && styles.filterOptionActive,
                    ]}
                    onPress={() => setCategoryFilter('all')}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        categoryFilter === 'all' && styles.filterOptionTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        categoryFilter === category && styles.filterOptionActive,
                      ]}
                      onPress={() => setCategoryFilter(category)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          categoryFilter === category && styles.filterOptionTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B5FFF" />
        </View>
      </SafeAreaView>
    );
  }

  const filteredTransactions = getFilteredTransactions();
  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  const hasActiveFilters = filterType !== 'all'  || categoryFilter !== 'all';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity 
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {hasActiveFilters ? 'No transactions match your filters' : 'No transactions found'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateTransactions.map(renderTransaction)}
            </View>
          ))
        )}
      </ScrollView>

      {renderFilters()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 35, color: '#000000', fontWeight: '300' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#5B5FFF' },
  filterButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#5B5FFF',
  },
  filterButtonText: { fontSize: 20, color: '#000000' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  dateGroup: { marginTop: 25 },
  dateHeader: { fontSize: 20, fontWeight: '600', color: '#000000', marginBottom: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#666' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  filterHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterOptionActive: {
    backgroundColor: '#5B5FFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#5B5FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HistoryScreen;