import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const getCategoryIcon = (name) => {
  switch (name.toLowerCase()) {
    case "home":
      return {
        icon: <Feather name="home" size={20} color="white" />,
        backgroundColor: "#3BCEAC",
      };
    case "streaming":
      return {
        icon: <Feather name="tv" size={20} color="white" />,
        backgroundColor: "#EC4899",
      };
    case "music":
      return {
        icon: <Feather name="music" size={20} color="white" />,
        backgroundColor: "#4A3DE3",
      };
    case "news":
      return {
        icon: (
          <MaterialCommunityIcons name="newspaper" size={20} color="white" />
        ),
        backgroundColor: "#F6AE2D",
      };
    default:
      return {
        icon: <Feather name="box" size={20} color="white" />,
        backgroundColor: "#666",
      };
  }
};

const formatCategoryName = (name: string) => {
  return name
    .split("_")
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
};

const AnalysisCard = ({
  data = [],
  size = 200,
  strokeWidth = 30,
  totalAmount,
  amountOfActive,
  backgroundColor = "transparent",
}) => {
  const radius = size / 2 - strokeWidth / 2;
  const center = size / 2;

  const createDonutPath = (percentage, startAngle, radius, strokeWidth) => {
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;

    const centerX = center;
    const centerY = center;
    const outerRadius = radius + strokeWidth / 2;
    const innerRadius = radius - strokeWidth / 2;

    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);

    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const renderChart = () => {
    let currentAngle = 0;

    return (
      <Svg width={size} height={size} style={{ backgroundColor }}>
        {data.map((item, index) => {
          const path = createDonutPath(
            item.percentage,
            currentAngle,
            radius,
            strokeWidth
          );
          currentAngle += (item.percentage / 100) * 360;

          return <Path key={index} d={path} fill={item.color} />;
        })}
      </Svg>
    );
  };

  const renderCenterContent = () => (
    <View style={styles.centerContentContainer}>
      <Text style={styles.totalLabel}>Total</Text>
      <Text style={styles.totalAmount}>${totalAmount}</Text>
      <Text style={styles.activeCount}>{amountOfActive} active</Text>
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      <View style={styles.chartSection}>
        <View style={styles.container}>
          {renderChart()}
          <View
            style={[
              styles.centerContent,
              {
                width: (radius - strokeWidth / 2) * 2,
                height: (radius - strokeWidth / 2) * 2,
                borderRadius: radius - strokeWidth / 2,
              },
            ]}
          >
            {renderCenterContent()}
          </View>
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>Categories</Text>
        <ScrollView style={styles.categoriesContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: getCategoryIcon(item.name)
                        .backgroundColor,
                    },
                  ]}
                >
                  {getCategoryIcon(item.name).icon}
                </View>
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryName}>
                    {formatCategoryName(item.name)}
                  </Text>
                  <Text style={styles.categoryPercentage}>
                    {item.percentage}% of spending
                  </Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>${item.amount}</Text>
                <Feather name="chevron-right" size={20} color="#666" />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 61, 227, 0.1)",
  },
  chartSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  centerContent: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  centerContentContainer: {
    alignItems: "center",
    gap: 5,
  },
  totalLabel: {
    color: "#1C1C1C",
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: 24,
  },
  totalAmount: {
    color: "#4A3DE3",
    fontSize: 20,
    fontFamily: "Inter",
    fontWeight: "600",
    lineHeight: 28,
  },
  activeCount: {
    color: "#1C1C1C",
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: 20,
  },
  categoriesSection: {
    marginTop: 16,
  },
  categoriesTitle: {
    color: "black",
    fontSize: 18,
    fontFamily: "Inter",
    fontWeight: "600",
    lineHeight: 28,
    textAlign: "center",
    width: "100%",
  },
  categoriesContainer: {
    maxHeight: 200,
  },
  categoryRow: {
    alignSelf: "stretch",
    paddingLeft: 12,
    paddingRight: 12,
    justifyContent: "space-between",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLeft: {
    width: 224.5,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    color: "black",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: 24,
  },
  categoryAmount: {
    color: "black",
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: 24,
    marginRight: 8,
  },
  categoryPercentage: {
    color: "#64748B",
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: 20,
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export { AnalysisCard };
