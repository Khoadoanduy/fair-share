import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useUserState } from '@/hooks/useUserState';
import SubscriptionCard from '@/components/SubscriptionCard';

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
  logo?: string;
  subscription?: {
    logo?: string;
    category?: string;
  };
  subscriptionType: "shared" | "personal";
  totalMem: number;
  amountEach: number;
}

interface EnrichedTransaction extends Transaction {
  groupData?: Group;
  subscriptionName?: string;
  category?: string;
  logo?: string | null;
  isPersonal?: boolean;
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
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
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
        const month = transactionDate.toLocaleDateString('en-US', { month: 'long' });
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
      const enrichmentPromises = transactionsResponse.data.map(async (transaction: Transaction) => {
        try {
          if (transaction.metadata?.groupId) {
            // Fetch group data including subscription relation
            const res = await axios.get(`${API_URL}/api/group/${transaction.metadata.groupId}`);
            const group: Group = res.data;
            console.log(group);
            console.log(group.subscriptionType);
            
            return {
              ...transaction,
              groupData: group,
              subscriptionName: group.subscriptionName,
              category: group.subscription?.category || group.category,
              logo: group.subscription?.logo || group.logo || null,
              isPersonal: group.subscriptionType == "personal",
              amount: group.amountEach
            };
          }
        } catch (err) {
          console.error(`Failed to fetch group data for transaction ${transaction.id}`, err);
          // Return null to filter out later
          return null;
        }
        
        // Return null for transactions without groupId
        return null;
      });

      const results = await Promise.all(enrichmentPromises);
      
      // Filter out failed fetches and transactions without group data
      const enrichedTransactions = results.filter(t => t !== null) as EnrichedTransaction[];
      
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
    const amount = transaction.amount;
    const name = transaction.subscriptionName || 'Subscription';
    const createdAt = new Date(transaction.created * 1000);
    const formattedTime = createdAt.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <View key={transaction.id}>
        <SubscriptionCard
          logo={transaction.logo ? { uri: transaction.logo } : null}
          subscriptionName={name}
          amountEach={amount}
          isPersonal={transaction.isPersonal}
          category={transaction.category}
          showNegativeAmount={true}
          timestamp={formattedTime}
        />
      </View>
    );
  };

  const FilterPill = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterPill, isActive && styles.filterPillActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        <FilterPill
          label="All"
          isActive={filterType === 'all'}
          onPress={() => setFilterType('all')}
        />
        <FilterPill
          label="Personal"
          isActive={filterType === 'personal'}
          onPress={() => setFilterType('personal')}
        />
        <FilterPill
          label="Shared"
          isActive={filterType === 'shared'}
          onPress={() => setFilterType('shared')}
        />
        <FilterPill
          label="Filters"
          isActive={showCategoryFilters}
          onPress={() => setShowCategoryFilters(!showCategoryFilters)}
        />
      </View>

      {showCategoryFilters && categories.length > 0 && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterContent}
          >
            <TouchableOpacity
              style={[styles.categoryPill, categoryFilter === 'all' && styles.categoryPillActive]}
              onPress={() => setCategoryFilter('all')}
            >
              <Text style={[styles.categoryPillText, categoryFilter === 'all' && styles.categoryPillTextActive]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryPill, categoryFilter === category && styles.categoryPillActive]}
                onPress={() => setCategoryFilter(category)}
              >
                <Text style={[styles.categoryPillText, categoryFilter === category && styles.categoryPillTextActive]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backButtonText: { 
    fontSize: 35, 
    color: '#000000', 
    fontWeight: '300' 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#5B5FFF' 
  },
  placeholder: { 
    width: 40 
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  categoryFilterContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: -5,
  },
  categoryFilterContent: {
    gap: 8,
    paddingRight: 20,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E8E9F3',
  },
  categoryPillActive: {
    backgroundColor: '#5B5FFF',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5B5FFF',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E8E9F3',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: '#5B5FFF',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B5FFF',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  scrollView: { 
    flex: 1, 
    paddingHorizontal: 20 
  },
  dateGroup: { 
    marginTop: 25 
  },
  dateHeader: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#000000', 
    marginBottom: 15 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 100 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#666' 
  },
});

export default HistoryScreen;