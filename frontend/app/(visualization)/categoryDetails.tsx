import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useUserState } from "@/hooks/useUserState";
import axios from "axios";
import SubscriptionCard from "@/components/SubscriptionCard";
import { sub } from "date-fns";

export default function CategoryDetailsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const params = useLocalSearchParams();
  const { userId } = useUserState();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategorySubscriptions = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/user/find-subs-by-category/${userId}/${params.category}`
        );
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Failed to fetch category subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && params.category) {
      fetchCategorySubscriptions();
    }
  }, [userId, params.category]);

  const formatCategoryName = (name: string) => {
    return name
      .split("_")
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView>
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              logo={{ uri: subscription.logo }}
              subscriptionName={subscription.subscriptionName}
              amountEach={subscription.amountEach}
              cycle={subscription.cycle}
              isShared={true}
              category={formatCategoryName(subscription.category)}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
