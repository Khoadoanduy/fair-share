import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

// API base URL - update this to match your backend URL (use IP address for local development)
const API_BASE_URL = 'http://192.168.1.53:3000/api';

export default function ProfileScreen() {
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const [jwt, setJwt] = useState<string | null>(null);
  
  // User data state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginPress = () => {
    router.push('/sign-in');
  };

  const handleSignOutPress = async () => {
    try {
      setJwt(null);
      await signOut();
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
      return token;
    } catch (error) {
      console.error('Error fetching JWT:', error);
      setJwt('Error fetching token');
      return null;
    }
  };

  const copyTokenToClipboard = async () => {
    if (jwt) {
      await Clipboard.setStringAsync(jwt);
      Alert.alert('Success', 'Token copied to clipboard!');
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    if (!isSignedIn) return;
    
    setIsLoading(true);
    try {
      // Calls a function fetchJwt() that retrieves a JWT token for authorization, and waits for it to resolve.
      const token = await fetchJwt();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(`${API_BASE_URL}/users/userId`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setUserProfile(result.data);
        setPhoneNumber(result.data.phoneNumber || '');
        setAddress(result.data.address || '');
      } else {
        console.error('Failed to load profile:', result.message);
        Alert.alert('Error', result.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Could not connect to server');
    // Ensures the loading spinner or state is turned off, regardless of success or failure.
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async () => {
    if (!isSignedIn) return;
    
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No authentication token');
      
      // Validate phone number (optional field)
      if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
        Alert.alert('Invalid Input', 'Please enter a valid phone number');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/userId`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber || null,
          address: address || null
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUserProfile(result.data);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Update Failed', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Discard changes
      setPhoneNumber(userProfile?.phoneNumber || '');
      setAddress(userProfile?.address || '');
    }
    setIsEditing(!isEditing);
  };

  // Load profile when signed in
  useEffect(() => {
    if (isSignedIn) {
      fetchUserProfile();
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4353FD" />
            </View>
          )}
          
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Profile</Text>
              <TouchableOpacity onPress={toggleEditMode} style={styles.editButton}>
                <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#4353FD" />
                <Text style={styles.editButtonText}>{isEditing ? "Cancel" : "Edit"}</Text>
              </TouchableOpacity>
            </View>

            {/* Personal Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              {user && (
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.fullName || `${user.firstName} ${user.lastName}`}
                  </Text>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <View style={styles.emailContainer}>
                    <Text style={styles.userEmail}>{user.primaryEmailAddress?.emailAddress}</Text>
                    <Text style={styles.readOnlyText}>(managed by Clerk)</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Contact Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <Text style={styles.infoLabel}>Phone Number:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{userProfile?.phoneNumber || 'Not provided'}</Text>
              )}
            </View>

            {/* Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              
              <Text style={styles.infoLabel}>Billing Address:</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  multiline
                />
              ) : (
                <Text style={styles.infoValue}>{userProfile?.address || 'Not provided'}</Text>
              )}
            </View>

            {/* Save Button in Edit Mode */}
            {isEditing && (
              <CustomButton 
                text="Save Changes" 
                onPress={updateProfile} 
                style={styles.saveButton}
              />
            )}

            {/* Authentication Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentication</Text>
              
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenTitle}>Your JWT Token:</Text>
                <ScrollView style={styles.tokenScroll}>
                  <Text style={styles.tokenText}>{jwt || 'Loading token...'}</Text>
                </ScrollView>
                <CustomButton 
                  text="Copy Token" 
                  onPress={copyTokenToClipboard} 
                  style={{marginTop: 10}} 
                />
              </View>
            </View>

            <CustomButton 
              text="Sign Out" 
              onPress={handleSignOutPress} 
              style={styles.signOutButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#4353FD',
  },
  userInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 16,
    flex: 1,
  },
  readOnlyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    marginLeft: 4,
    color: '#4353FD',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4353FD',
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: '#FF4B55',
    marginBottom: 24,
  },
  tokenContainer: {
    width: '100%',
    marginVertical: 8,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  tokenScroll: {
    maxHeight: 120,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  }
});