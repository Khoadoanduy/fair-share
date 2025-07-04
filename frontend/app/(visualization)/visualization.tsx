import { AnalysisCard } from "@/components/AnalysisCard";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function Visualization() {
  const [selectedView, setSelectedView] = useState("Monthly");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarType, setCalendarType] = useState<"month" | "year">("month");
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

    const categories = Object.entries(categoryTotals).map(
      ([category, amount]) => ({
        category,
        amount,
        exactPercentage: (amount / totalAmount) * 100,
        color: hashmap[category],
      })
    );

    const roundedCategories = categories.map((item) => ({
      ...item,
      percentage: Math.floor(item.exactPercentage),
    }));

    const totalRounded = roundedCategories.reduce(
      (sum, item) => sum + item.percentage,
      0
    );
    const remaining = 100 - totalRounded;
    const withDecimals = categories
      .map((item, index) => ({
        index,
        decimal: item.exactPercentage - Math.floor(item.exactPercentage),
      }))
      .sort((a, b) => b.decimal - a.decimal);
    for (let i = 0; i < remaining; i++) {
      const indexToIncrement = withDecimals[i % withDecimals.length].index;
      roundedCategories[indexToIncrement].percentage += 1;
    }

    return roundedCategories;
  }, [subscriptions, totalAmount]);

  const DatePicker = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const years = Array.from({ length: 12 }, (_, i) => 2014 + i);

    const handleCalendarPress = () => {
      setIsCalendarOpen(true);
      setCalendarType(selectedView === "Monthly" ? "month" : "year");
    };

    const handleMonthSelect = (month: string) => {
      setSelectedMonth(month);
      setIsCalendarOpen(false);
    };

    const handleYearSelect = (year: number) => {
      setSelectedYear(year);
      setIsCalendarOpen(false);
    };

    const handleYearHeaderClick = () => {
      setCalendarType("year");
    };

    return (
      <View style={styles.datePickerContainer}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={handleCalendarPress}
        >
          <View style={styles.calendarIcon}>
            <Feather name="calendar" size={24} color="#4A3DE3" />
          </View>
          <View style={styles.calendarRow}>
            <Text style={styles.currentValue}>
              {selectedView === "Monthly"
                ? selectedMonth
                  ? `${selectedMonth} ${selectedYear}`
                  : selectedYear.toString()
                : selectedYear.toString()}
            </Text>
          </View>
          <View style={styles.arrows}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() =>
                selectedView === "Monthly"
                  ? setSelectedMonth(
                      months[(months.indexOf(selectedMonth) - 1 + 12) % 12]
                    )
                  : setSelectedYear(selectedYear - 1)
              }
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() =>
                selectedView === "Monthly"
                  ? setSelectedMonth(
                      months[(months.indexOf(selectedMonth) + 1) % 12]
                    )
                  : setSelectedYear(selectedYear + 1)
              }
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isCalendarOpen && (
          <View style={styles.calendarPopup}>
            {calendarType === "month" ? (
              <>
                <TouchableOpacity
                  style={styles.yearHeader}
                  onPress={handleYearHeaderClick}
                >
                  <Text style={styles.yearHeaderText}>{selectedYear}</Text>
                </TouchableOpacity>
                <View style={styles.monthGrid}>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthItem,
                        month === selectedMonth && styles.selectedItem,
                      ]}
                      onPress={() => handleMonthSelect(month)}
                    >
                      <Text
                        style={[
                          styles.monthText,
                          month === selectedMonth && styles.selectedItemText,
                        ]}
                      >
                        {month.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.yearGrid}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearItem,
                      year === selectedYear && styles.selectedItem,
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text
                      style={[
                        styles.yearText,
                        year === selectedYear && styles.selectedItemText,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <DatePicker />
      <AnalysisCard
        data={categoryData.map((item) => ({
          name: item.category,
          percentage: item.percentage,
          amount: item.amount.toFixed(2),
          color: item.color,
        }))}
        amountOfActive={subscriptions.length}
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
  datePickerContainer: {
    backgroundColor: "#4A3DE31A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
    justifyContent: "space-between",
  },
  selectedToggle: {
    backgroundColor: "white",
  },
  toggleText: {
    fontSize: 16,
    color: "#6B7280",
  },
  selectedToggleText: {
    color: "#4A3DE3",
    fontWeight: "500",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
  },
  calendarRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  calendarIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  currentValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  arrows: {
    flexDirection: "row",
    gap: 8, // Add space between arrows
  },
  arrowButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#4A3DE31A", // Light purple background
  },
  arrowText: {
    color: "#4A3DE3",
    fontSize: 20,
    fontWeight: "500",
  },
  calendarPopup: {
    position: "absolute",
    top: "100%",
    width: "100%", // This ensures same width as parent
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
    zIndex: 1000,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    padding: 8,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: "#4A3DE3",
  },
  monthText: {
    color: "#1F2937",
    fontWeight: "500",
  },
  selectedItemText: {
    color: "white",
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  yearItem: {
    width: "23%",
    padding: 8,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
    opacity: 1,
  },
  yearText: {
    color: "#1F2937",
    fontWeight: "500",
  },
  yearHeader: {
    padding: 8,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
  },
  yearHeaderText: {
    color: "#1F2937",
    fontWeight: "500",
    fontSize: 16,
  },
});