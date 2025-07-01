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
  activeColor = '#000',
  inactiveColor = '#ccc',
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
    marginBottom: 20,
    marginTop: 10,
  },
  dot: {
    marginHorizontal: 5,
  },
});

export default ProgressDots;
