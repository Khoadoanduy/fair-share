import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface Transaction {
  id: string;
  amount: number;
  created: number;
  status: string;
  currency?: string;
  description?: string;
}

interface GroupedTransactions {
  [date: string]: Transaction[];
}

const HistoryScreen = () => {
  const router = useRouter();
  const { userId: clerkId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [logos, setLogos] = useState<{ [key: string]: string | null }>({});

  const groupTransactionsByDate = (transactions: Transaction[]): GroupedTransactions => {
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
      const user = await axios.get(`${API_URL}/api/user`, {
        params: { clerkID: clerkId },
      });

      if (!user.data.customerId) {
        setLoading(false);
        return;
      }

      const transactionsResponse = await axios.get(`${API_URL}/api/stripe-payment/transactions`, {
        params: { customerStripeID: user.data.customerId },
      });

      setTransactions(transactionsResponse.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogosForTransactions = async () => {
    const logoMap: { [key: string]: string | null } = {};

    for (const transaction of transactions) {
      const name = transaction.description;
      if (name && !logos[name]) {
        try {
          const res = await axios.get(`${API_URL}/api/subscriptions`, {
            params: { search: name },
          });
          const match = res.data[0]
          console.log(`Fetched logo for ${name}:`, match.logo);
          logoMap[name] = match.logo || null;
        } catch (err) {
          console.error(`Failed to fetch logo for ${name}`, err);
          logoMap[name] = null;
        }
      }
    }

    setLogos((prev) => ({ ...prev, ...logoMap }));
  };

  useEffect(() => {
    if (clerkId) {
      fetchTransactions();
    }
  }, [clerkId]);

  useEffect(() => {
    if (transactions.length > 0) {
      fetchLogosForTransactions();
    }
  }, [transactions]);

  const getStatusColor = (status: string) => {
    return status === 'succeeded' ? '#4CAF50' : '#FFA500';
  };

  const renderTransaction = (transaction: Transaction) => {
    const amount = (transaction.amount / 100).toFixed(2);
    const status = transaction.status === 'succeeded' ? 'Succeed' : 'Pending';
    const name = transaction.description || 'Subscription';
    const logo = logos[name];
    const createdAt = new Date(transaction.created * 1000);
    const formattedDateTime = createdAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const icon = logo ? (
      <View style={styles.iconContainer}>
        <Image source={{ uri: logo }} style={styles.logoImage} />
      </View>
    ) : (
      <View style={[styles.iconContainer, { backgroundColor: '#6B7280' }]}>
        <Text style={styles.iconText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
    );

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionContent}>
          {icon}
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionName}>{name}</Text>
            <Text style={styles.transactionTimestamp}>{formattedDateTime}</Text>
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.amount}>-${amount}</Text>
            <Text style={[styles.status, { color: getStatusColor(transaction.status) }]}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B5FFF" />
        </View>
      </SafeAreaView>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {transactions.length === 0 ? (
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
  placeholder: { width: 40 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  dateGroup: { marginTop: 25 },
  dateHeader: { fontSize: 20, fontWeight: '600', color: '#000000', marginBottom: 15 },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  logoImage: { width: 50, height: 50, borderRadius: 25, resizeMode: 'cover' },
  transactionDetails: { flex: 1 },
  transactionName: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 5 },
  rightSection: { alignItems: 'flex-end' },
  amount: { fontSize: 20, fontWeight: '600', color: '#000000', marginBottom: 5 },
  status: { fontSize: 16, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#666' },
  transactionTimestamp: {
    fontSize: 14,
    color: '#555',
  }
});

export default HistoryScreen;
