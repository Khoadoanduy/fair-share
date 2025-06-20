import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useUserState } from "@/hooks/useUserState";
import { useEffect, useState, useMemo } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { usePushNotifications } from "@/utils/notificationUtils";
import GroupCard from "@/components/GroupCard";
import axios from "axios";
import { sub } from "date-fns";
import { formatRelativeDate, getDaysRemaining } from "@/utils/dateUtils";
import Feather from "@expo/vector-icons/Feather";

type GroupData = {
  subscription: {
    id: string;
    groupName: string;
    subscriptionName: string;
    amountEach: number;
    cycle: string;
    category: string;
    logo: string;
    nextPaymentDate: string; // Add this field
  };
};

export default function HomeScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { name, userId } = useUserState();
  const [subscriptions, setSubscriptions] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  usePushNotifications();

  useEffect(() => {
    const fetchGroups = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_URL}/api/user/groups/${userId}`
        );
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [userId]);

  const totalAmount = useMemo(() => {
    return subscriptions.reduce(
      (sum, subscription) => sum + subscription.amountEach,
      0
    );
  }, [subscriptions]);

  // Add a function to calculate upcoming renewals
  const getUpcomingRenewals = () => {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    return subscriptions.filter((subscription) => {
      const renewalDate = new Date(subscription.endDate);
      return renewalDate >= today && renewalDate <= oneWeekFromNow;
    }).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Pressable style={styles.content}>
          <Text style={styles.welcomeText}>Welcome, {name}</Text>

          {/* Add Summary Box */}
          <View style={styles.summaryBox}>
            <Pressable style={styles.cycleSelector}>
              <Text style={styles.cycleText}>Monthly</Text>
              <Text style={styles.cycleArrow}>›</Text>
            </Pressable>

            <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statTitle}>Active subscriptions</Text>
                <View style={styles.iconContainer}>
                  <Feather name="check-circle" size={24} color="black" />
                </View>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{subscriptions.length}</Text>
                </View>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statTitle}>Upcoming Renewals</Text>
                <View style={styles.iconContainer}>
                  <Feather name="clock" size={24} color="black" />
                </View>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>
                    {getUpcomingRenewals(subscriptions)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Pressable>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A3DE3" />
            <Text style={styles.loadingText}>Loading subscriptions...</Text>
          </View>
        ) : subscriptions.length > 0 ? (
          <View style={styles.subscriptionsList}>
            {subscriptions.map((subscription, index) => (
              <Text key={index}>
                <GroupCard
                  logo={{ uri: subscription.logo }}
                  subscriptionName={subscription.groupName}
                  cycle={subscription.cycle}
                  amountEach={subscription.amountEach}
                  isShared={true}
                  category={subscription.category}
                />
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No subscriptions found</Text>
            <Text style={styles.emptySubtext}>
              Join or create a group to get started!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    gap: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  subscriptionsList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  summaryBox: {
    backgroundColor: "#F4F3FF",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  cycleSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  cycleText: {
    color: "#4A3DE3",
    fontSize: 16,
    fontWeight: "600",
  },
  cycleArrow: {
    color: "#4A3DE3",
    fontSize: 20,
    marginLeft: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FCFBFF",
    borderRadius: 12,
    padding: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "black",
    marginBottom: 4,
    paddingRight: 32, // Add padding to prevent text overlap with icon
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#4A3DE3",
  },
  iconContainer: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    right: 8,
    top: 8,
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  clockIcon: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
