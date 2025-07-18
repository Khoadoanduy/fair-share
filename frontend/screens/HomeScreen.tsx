import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useUserState } from "@/hooks/useUserState";
import { useEffect, useState, useMemo } from "react";
import { usePushNotifications } from "@/utils/notificationUtils";
import SubscriptionCard from "@/components/SubscriptionCard";
import axios from "axios";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { formatCategoryName } from "@/utils/categoryName";

type GroupData = {
  subscription: {
    id: string;
    groupName: string;
    subscriptionName: string;
    amountEach: number;
    cycle: string;
    category: string;
    logo: string;
    nextPaymentDate: string;
    virtualCardId: string;
  };
};

export default function HomeScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { name, userId } = useUserState();
  const [subscriptions, setSubscriptions] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  usePushNotifications(userId);

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

  const hasSubscriptions = subscriptions.length > 0;

  const totalAmount = useMemo(() => {
    if (!hasSubscriptions) return 0;
    return subscriptions.reduce(
      (sum, subscription) => sum + subscription.amountEach,
      0
    );
  }, [subscriptions]);

  const getUpcomingRenewals = () => {
    if (!hasSubscriptions) return [];

    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    return subscriptions.filter((subscription) => {
      const renewalDate = new Date(subscription.endDate);
      return renewalDate >= today && renewalDate <= oneWeekFromNow;
    });
  };
  const totalAmountOfUpcomingRenewals = useMemo(() => {
    if (!hasSubscriptions) return 0;

    return getUpcomingRenewals().reduce(
      (sum, subscription) => sum + subscription.amountEach,
      0
    );
  }, [subscriptions]);
  const handleSummry = () => {
    router.push({
      pathname: "/(visualization)/visualization",
      params: {
        subscriptions: JSON.stringify(subscriptions),
      },
    });
  };

  const getNonUpcomingSubscriptions = () => {
    if (!hasSubscriptions) return [];

    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    return subscriptions.filter((subscription) => {
      const renewalDate = new Date(subscription.endDate);
      return renewalDate > oneWeekFromNow;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome, {name}</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A3DE3" />
              <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
          ) : !hasSubscriptions ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconContainer}>
                <Feather name="inbox" size={48} color="#6B7280" />
              </View>
              <Text style={styles.emptyStateTitle}>No Subscriptions Yet</Text>
              <Text style={styles.emptyStateText}>
                Start by creating or joining a subscription group
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => handleSummry()}
                style={styles.summaryBox}
              >
                <Pressable style={styles.cycleSelector}>
                  <Text style={styles.cycleText}>Monthly</Text>
                  <Text style={styles.cycleArrow}>›</Text>
                </Pressable>

                <Text style={styles.totalAmount}>
                  ${totalAmount.toFixed(2)}
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statTitle}>Active subscriptions</Text>
                    <View style={styles.iconContainer}>
                      <Feather name="check-circle" size={24} color="black" />
                    </View>
                    <View style={styles.statValueContainer}>
                      <Text style={styles.statValue}>
                        {getUpcomingRenewals().length + getNonUpcomingSubscriptions().length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statTitle}>Upcoming Renewals</Text>
                    <View style={styles.iconContainer}>
                      <Feather name="clock" size={24} color="black" />
                    </View>
                    <View style={styles.statValueContainer}>
                      <Text style={styles.statValue}>
                        {getUpcomingRenewals().length}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              <View style={styles.upcomingRenewalsSection}>
                <View style={styles.headerContainer}>
                  <View style={styles.titleGroup}>
                    <Text style={styles.sectionTitle}>Upcoming Renewals</Text>
                    <View style={styles.verticalSeparator} />
                  </View>
                  {getUpcomingRenewals().length > 0 && (
                    <Text style={styles.upcomingAmount}>
                      ${totalAmountOfUpcomingRenewals.toFixed(2)}
                    </Text>
                  )}
                </View>

                {getUpcomingRenewals().length > 0 ? (
                  <View style={styles.subscriptionsList}>
                    {getUpcomingRenewals().map((subscription, index) => (
                      <SubscriptionCard
                        key={`renewal-${index}`}
                        logo={{ uri: subscription.subscription.logo }}
                        subscriptionName={subscription.groupName}
                        cycle={subscription.cycle}
                        amountEach={subscription.amountEach}
                        isShared
                        virtualCardId={subscription.virtualCardId}
                        category={formatCategoryName(subscription.category)}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.noUpcomingContainer}>
                    <Text style={styles.noUpcomingText}>
                      No upcoming renewals in the next 7 days
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.allSubscriptionsSection}>
                <View style={styles.headerContainer}>
                  <View style={styles.titleGroup}>
                    <Text style={styles.sectionTitle}>Other Subscriptions</Text>
                  </View>
                </View>
                <View style={styles.subscriptionsList}>
                  {getNonUpcomingSubscriptions().map((subscription, index) => (
                    <SubscriptionCard
                      key={`subscription-${index}`}
                      logo={{ uri: subscription.subscription.logo }}
                      subscriptionName={subscription.groupName}
                      cycle={subscription.cycle}
                      amountEach={subscription.amountEach}
                      isShared
                      category={formatCategoryName(subscription.category)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
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
    marginBottom: 0,
    gap: 10,
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
  subscriptionsList: {},
  emptyStateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptyStateText: {
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
    paddingRight: 32,
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
  upcomingRenewalsSection: {
    marginTop: 24,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  verticalSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#ccc",
    marginLeft: 12,
  },
  upcomingAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  noUpcomingContainer: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 16,
  },
  noUpcomingText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  allSubscriptionsSection: {
    marginTop: 15,
  },
});
