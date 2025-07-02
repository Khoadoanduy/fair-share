import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressDotsProps {
  totalSteps: number;
  currentStep: number;
  activeColor?: string;
  inactiveColor?: string;
  size?: number;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({
  totalSteps,
  currentStep,
  activeColor = '#4A3DE3', // Changed from '#000' to match your app's primary color
  inactiveColor = '#E0E0E0', // Changed from '#ccc' to a lighter gray
  size = 8,
}) => {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: currentStep === index + 1 ? activeColor : inactiveColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // Added for better alignment
    marginBottom: 20,
    marginTop: 10,
  },
  dot: {
    marginHorizontal: 4, // Reduced from 5 to 4 for slightly tighter spacing
  },
});

export default ProgressDots;