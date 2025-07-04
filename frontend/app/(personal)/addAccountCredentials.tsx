import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import CredentialsVisibilityToggle from '@/components/CredentialsVisibilityToggle';
import ProgressDots from '@/components/ProgressDots';
import { useUserState } from '@/hooks/useUserState';

export default function AddAccountCredentialsScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const { groupId, personalType } = useLocalSearchParams();
  const router = useRouter();
  const { userId } = useUserState();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      // Use unified endpoint for credentials update
      await axios.put(`${API_URL}/api/group/${groupId}/credentials`, {
        credentialUsername: username.trim(),
        credentialPassword: password.trim(),
        userId,
      });

      router.push({
        pathname: '/(personal)/personalSubscriptionDetails',
        params: { groupId, personalType },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  // Use personalType for progress dots and navigation
  const isVirtualFlow = personalType === 'virtual';
  const totalSteps = isVirtualFlow ? 4 : 3;
  const currentStep = isVirtualFlow ? 4 : 3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.formContainer}>

          {/* Title */}
          <Text style={styles.title}>Add personal subscription</Text>
          <Text style={styles.subtitle}>Keep track of your account credentials</Text>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Username/Email</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter account username/email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.optional}>Optional</Text>

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Save account password"
                placeholderTextColor="#999"
                secureTextEntry={!isVisible}
              />
            </View>
            <Text style={styles.optional}>Optional</Text>
          </View>
        </View>
      </View>

      {/* Progress Dots - Dynamic based on flow */}
      <View style={styles.bottomContainer}>
        <ProgressDots totalSteps={totalSteps} currentStep={currentStep} />
        <Pressable
          style={[styles.nextButton, loading && styles.disabledButton]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Saving...' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  formContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4A3DE3',
    textAlign: 'center',
    marginTop: -20
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 20,
    color: '#000',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  optional: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 10,
  },
  nextButton: {
    backgroundColor: '#5E5AEF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});