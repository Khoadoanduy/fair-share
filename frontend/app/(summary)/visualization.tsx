import { AnalysisCard } from "@/components/AnalysisCard";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Visualization() {
  const params = useLocalSearchParams();
  const subscriptions = JSON.parse(params.subscriptions as string);

  const hashmap = {
    home: "#3BCEAC",
    streaming: "#EC4899",
    music: "#4A3DE3",
    news: "#F6AE2D",
    cloud_storage: "#666",
  };

  const hasSubscriptions = subscriptions.length > 0;

  const totalAmount = useMemo(() => {
    if (!hasSubscriptions) return 0;
    return subscriptions.reduce(
      (sum, subscription) => sum + subscription.amountEach,
      0
    );
  }, [subscriptions]);

  const categoryData = useMemo(() => {
    if (!hasSubscriptions) return [];

    const categoryTotals = subscriptions.reduce((acc, subscription) => {
      const category = subscription.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += subscription.amountEach;
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / totalAmount) * 100),
      color: hashmap[category],
    }));
  }, [subscriptions, totalAmount]);

  return (
    <View style={styles.container}>
      <View style={styles.calendarPlaceholder} />
      <AnalysisCard
        data={categoryData.map((item) => ({
          name: item.category,
          percentage: item.percentage,
          amount: item.amount.toFixed(2),
          color: item.color,
        }))}
        amountOfActive={subscriptions.length} // Add this line as a separate prop
        totalAmount={totalAmount.toFixed(2)}
        size={200}
        strokeWidth={25}
        backgroundColor="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
  },
  calendarPlaceholder: {
    height: 100, // Adjust this value based on your needs
    marginBottom: 16,
  },
});
