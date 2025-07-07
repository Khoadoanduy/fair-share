import { AnalysisCard } from "@/components/AnalysisCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState, useEffect, useRef } from "react";
import Feather from "@expo/vector-icons/Feather";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import mockPaymentData from "@/utils/mockData.json";
import axios from "axios";

export default function Visualization() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [selectedView, setSelectedView] = useState("Monthly");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarType, setCalendarType] = useState<"month" | "year">("month");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [chartAnimation] = useState(new Animated.Value(0));
  const [categoryDataState, setCategoryData] = useState([]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const subscriptions = JSON.parse(params.subscriptions as string);

  // Update the hashmap to include more categories and their variations
  const hashmap = {
    home: "#3BCEAC",
    streaming: "#EC4899",
    music: "#4A3DE3",
    news: "#F6AE2D",
    cloud_storage: "#666",
    other: "#666",
    // Add variations
    "cloud-storage": "#666",
    "cloud storage": "#666",
  };

  const hasSubscriptions = subscriptions.length > 0;

  // Convert month name to month number (0-11)
  const getMonthNumber = (monthName) => {
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
    return months.indexOf(monthName);
  };

  // Filter payments based on selected date
  useEffect(() => {
    if (mockPaymentData && mockPaymentData.length > 0) {
      let filtered = [];

      if (selectedView === "Monthly") {
        const monthNumber = getMonthNumber(selectedMonth);

        filtered = mockPaymentData.filter((payment) => {
          const paymentDate = new Date(payment.created * 1000);
          return (
            paymentDate.getFullYear() === selectedYear &&
            paymentDate.getMonth() === monthNumber
          );
        });
      } else {
        // Yearly view
        filtered = mockPaymentData.filter((payment) => {
          const paymentDate = new Date(payment.created * 1000);
          return paymentDate.getFullYear() === selectedYear;
        });
      }

      setFilteredPayments(filtered);

      // Reset chart animation value
      chartAnimation.setValue(0);

      // Delay the animation start by 300ms
      setTimeout(() => {
        Animated.timing(chartAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 1000);
    }
  }, [selectedMonth, selectedYear, selectedView, chartAnimation]);

  const totalAmount = useMemo(() => {
    if (filteredPayments.length === 0) return 0;
    return filteredPayments.reduce(
      (sum, payment) => sum + payment.amount / 100, // Convert cents to dollars
      0
    );
  }, [filteredPayments]);

  const categoryData = useMemo(async () => {
    if (filteredPayments.length === 0) return [];

    try {
      // Get all groups from filtered payments
      const groupIds = [...new Set(filteredPayments.map(payment => 
        payment.metadata?.groupId).filter(Boolean))];

      // Fetch group details for each group
      const groupResponses = await Promise.all(
        groupIds.map(groupId => 
          axios.get(`${API_URL}/api/group/${groupId}`)
        )
      );

      const groups = groupResponses.map(response => response.data);

      // Calculate totals by category
      const categoryTotals = {};
      filteredPayments.forEach(payment => {
        const group = groups.find(g => g.id === payment.metadata?.groupId);
        if (!group) return;

        const category = group.category?.toLowerCase() || 'other';
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += payment.amount / 100; // Convert cents to dollars
      });

      // Format data for chart
      const categories = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        exactPercentage: (amount / totalAmount) * 100,
        color: hashmap[category] || "#666",
        subscriptions: groups
          .filter(group => group.category?.toLowerCase() === category)
          .map(group => ({
            ...group,
            logo: group.subscription?.logo || group.logo,
            subscriptionName: group.subscriptionName,
            amountEach: group.amountEach,
            cycle: group.cycle
          }))
      }));

      // Round percentages
      const roundedCategories = categories.map(item => ({
        ...item,
        percentage: Math.floor(item.exactPercentage)
      }));

      // Adjust rounding
      const totalRounded = roundedCategories.reduce(
        (sum, item) => sum + item.percentage, 0
      );
      const remaining = 100 - totalRounded;
      
      if (remaining > 0) {
        const withDecimals = categories
          .map((item, index) => ({
            index,
            decimal: item.exactPercentage - Math.floor(item.exactPercentage)
          }))
          .sort((a, b) => b.decimal - a.decimal);
          
        for (let i = 0; i < remaining; i++) {
          const indexToIncrement = withDecimals[i % withDecimals.length]?.index || 0;
          roundedCategories[indexToIncrement].percentage += 1;
        }
      }

      return roundedCategories;

    } catch (error) {
      console.error('Error fetching category data:', error);
      return [];
    }
  }, [filteredPayments, totalAmount, API_URL]);

  // Update the AnalysisCard usage to handle Promise
  useEffect(() => {
    const loadCategoryData = async () => {
      const data = await categoryData;
      // Update state to trigger re-render
      setCategoryData(data);
    };
    
    loadCategoryData();
  }, [categoryData]);

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

    // Update calendar type when view changes
    useEffect(() => {
      setCalendarType(selectedView === "Monthly" ? "month" : "year");
    }, [selectedView]);

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

  // Handle navigation to category details
  const handleCategoryPress = (category) => {
    router.push({
      pathname: "/(visualization)/categoryDetails",
      params: {
        category: category.category,
        amount: category.amount.toFixed(2),
        percentage: category.percentage,
        color: category.color,
        subscriptions: JSON.stringify(category.subscriptions),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedView === "Monthly" && styles.selectedToggle,
          ]}
          onPress={() => setSelectedView("Monthly")}
        >
          <Text
            style={[
              styles.toggleText,
              selectedView === "Monthly" && styles.selectedToggleText,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedView === "Yearly" && styles.selectedToggle,
          ]}
          onPress={() => setSelectedView("Yearly")}
        >
          <Text
            style={[
              styles.toggleText,
              selectedView === "Yearly" && styles.selectedToggleText,
            ]}
          >
            Yearly
          </Text>
        </TouchableOpacity>
      </View>

      <DatePicker />

      {categoryDataState.length > 0 ? (
        <Animated.View
          style={{
            opacity: chartAnimation,
            transform: [
              {
                scale: chartAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          }}
        >
          <AnalysisCard
            data={categoryDataState.map((item) => ({
              name: item.category,
              percentage: item.percentage,
              amount: item.amount.toFixed(2),
              color: item.color,
              subscriptions: item.subscriptions,
            }))}
            amountOfActive={filteredPayments.length}
            totalAmount={totalAmount.toFixed(2)}
            size={200}
            strokeWidth={25}
            backgroundColor="white"
          />
        </Animated.View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No payment data available for{" "}
            {selectedView === "Monthly"
              ? `${selectedMonth} ${selectedYear}`
              : selectedYear}
          </Text>
        </View>
      )}
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
  noDataContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
