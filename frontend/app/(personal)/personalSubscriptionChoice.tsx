import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import ProgressDots from '@/components/ProgressDots';

export default function PersonalSubscriptionChoiceScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<'existing' | 'virtual' | null>(null);

  const handleNext = () => {
    if (!selectedOption) return;
    router.push({
      pathname: '/(personal)/personalSubscriptionInfo',
      params: { personalType: selectedOption } // Use personalType for clarity
    });
  };

  // Calculate total steps based on selected option
  const getTotalSteps = () => {
    return selectedOption === 'virtual' ? 4 : 3; // Virtual has 4 steps, existing has 3
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add personal subscription</Text>
        <Text style={styles.subtitle}>How would you like to add your subscription?</Text>

        <View style={styles.optionsContainer}>
          <Pressable
            style={[
              styles.optionCard,
              selectedOption === 'existing' && styles.selectedCard
            ]}
            onPress={() => {
              setSelectedOption('existing');
            }}
          >
            <View style={styles.radioContainer}>
              <View style={[
                styles.radioButton,
                selectedOption === 'existing' && styles.radioSelected
              ]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Track an existing subscription</Text>
              <Text style={styles.optionDescription}>
                Add your current subscription plan for tracking and management
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.optionCard,
              selectedOption === 'virtual' && styles.selectedCard
            ]}
            onPress={() => {
              setSelectedOption('virtual');
            }}
          >
            <View style={styles.radioContainer}>
              <View style={[
                styles.radioButton,
                selectedOption === 'virtual' && styles.radioSelected
              ]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Start with a virtual card (10¢ fee)</Text>
              <Text style={styles.optionDescription}>
                We'll create a virtual card for you to subscribe, with added security and auto-cancellation
              </Text>
              <View style={styles.featuresContainer}>
                <Text style={styles.featureText}>• Protects against overspending by setting a spending limit</Text>
                <Text style={styles.featureText}>• Automatically cancels to avoid forgotten charges</Text>
                <Text style={styles.featureText}>• Ideal for trials or variable-cost services.</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <ProgressDots totalSteps={getTotalSteps()} currentStep={1} />
        <CustomButton
          text="Next"
          onPress={handleNext}
          size="large"
          fullWidth
          style={[
            styles.nextButton,
            !selectedOption && styles.disabledButton
          ]}
          disabled={!selectedOption}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A3DE3',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: -20
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  selectedCard: {
    borderColor: '#4A3DE3',
    backgroundColor: '#F8F9FF',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioSelected: {
    borderColor: '#4A3DE3',
    backgroundColor: '#4A3DE3',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 2,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
    backgroundColor: 'white',
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
});