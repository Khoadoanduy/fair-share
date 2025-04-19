import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton';

export default function ProfileScreen() {
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const [jwt, setJwt] = useState<string | null>(null);

  const handleLoginPress = () => {
    router.push('/sign-in');
  };

  const handleSignOutPress = async () => {
    try {
      // Clear JWT state
      setJwt(null);

      // Sign out from Clerk
      await signOut();

      // Navigate to welcome screen after sign out completes
      // Using replace instead of push prevents going back to the profile screen
      router.replace('/(welcome)');

    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const fetchJwt = async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      setJwt(token);
    } catch (error) {
      console.error('Error fetching JWT:', error);
      setJwt('Error fetching token');
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchJwt();
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.message}>Please sign in to view your profile</Text>
          <CustomButton text="Login" onPress={handleLoginPress} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>

          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </Text>
              <Text style={styles.userEmail}>{user.primaryEmailAddress?.emailAddress}</Text>
            </View>
          )}

          <View style={styles.tokenContainer}>
            <Text style={styles.tokenTitle}>Your JWT Token:</Text>
            <ScrollView style={styles.tokenScroll}>
              <Text style={styles.tokenText}>{jwt || 'Loading token...'}</Text>
            </ScrollView>
          </View>

          <CustomButton text="Sign Out" onPress={handleSignOutPress} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  tokenContainer: {
    width: '100%',
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  tokenScroll: {
    maxHeight: 200,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});