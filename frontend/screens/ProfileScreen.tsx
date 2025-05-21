import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import axios from "axios";
import CustomButton from '../components/CustomButton';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

// API base URL - update with your actual backend URL
const API_URL = process.env.EXPO_PUBLIC_API_URL

export default function ProfileScreen() {
    const { isSignedIn, signOut, getToken } = useAuth();
    const { user } = useUser();
    const [jwt, setJwt] = useState<string | null>(null);

    // User data state
    const [userProfile, setUserProfile] = useState<any>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [addressData, setAddressData] = useState<{
        country: string;
        street: string;
        apartment: string;
        city: string;
        state: string;
        zipCode: string;
    }>({
        country: '',
        street: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: ''
    });

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
            console.error("Error during sign out:", error);
        }
    };

    const fetchJwt = async () => {
        if (!isSignedIn) return;

        try {
            const token = await getToken();
            setJwt(token);
            return token;
        } catch (error) {
            console.error("Error fetching JWT:", error);
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
        if (!isSignedIn || !user) return;

        setIsLoading(true);
        try {
            const token = await fetchJwt();
            if (!token) throw new Error('No authentication token');

            const response = await axios.get(`${API_URL}/api/user`, {
                params: {
                    clerkID: user.id
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const userData = response.data;

            if (userData) {
                setUserProfile(userData);
                setPhoneNumber(userData.phoneNumber || '');
                // Handle structured address
                if (userData.address) {
                    setAddressData(userData.address);
                } else {
                    setAddressData({
                        country: '',
                        street: '',
                        apartment: '',
                        city: '',
                        state: '',
                        zipCode: ''
                    });
                }
            } else {
                console.error('Failed to load profile: No user data returned');
                Alert.alert('Error', 'Failed to load profile');
            }
        } catch (error: any) {
            console.error("Error fetching profile:", error);
            const errorMessage = error.response?.data || 'Could not connect to server';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Update user profile
    const updateProfile = async () => {
        if (!isSignedIn || !user) return;

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

            // Check if any address field is filled
            const hasAddressData = Object.values(addressData).some(value => value.trim() !== '');

            // Send address only if at least one field is filled
            const addressToSend = hasAddressData ? addressData : null;

            const response = await axios.put(
                `${API_URL}/api/user/${user.id}`,
                {
                    phoneNumber: phoneNumber || null,
                    address: addressToSend
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const updatedUser = response.data;

            if (updatedUser) {
                setUserProfile(updatedUser);
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                Alert.alert('Update Failed', 'Failed to update profile');
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            const errorMessage = error.response?.data || 'An error occurred while updating your profile';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle edit mode
    const toggleEditMode = () => {
        if (isEditing) {
            // Discard changes
            setPhoneNumber(userProfile?.phoneNumber || '');
            if (userProfile?.address) {
                setAddressData(userProfile.address);
            } else {
                setAddressData({
                    country: '',
                    street: '',
                    apartment: '',
                    city: '',
                    state: '',
                    zipCode: ''
                });
            }
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

                            {isEditing ? (
                                <View style={styles.addressInputContainer}>
                                    <Text style={styles.infoLabel}>Country:</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={addressData.country}
                                        onChangeText={(text) => setAddressData({ ...addressData, country: text })}
                                        placeholder="Country"
                                    />

                                    <Text style={styles.infoLabel}>Street:</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={addressData.street}
                                        onChangeText={(text) => setAddressData({ ...addressData, street: text })}
                                        placeholder="Street address"
                                    />

                                    <Text style={styles.infoLabel}>Apartment (optional):</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={addressData.apartment}
                                        onChangeText={(text) => setAddressData({ ...addressData, apartment: text })}
                                        placeholder="Apartment, suite, etc."
                                    />

                                    <Text style={styles.infoLabel}>City:</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={addressData.city}
                                        onChangeText={(text) => setAddressData({ ...addressData, city: text })}
                                        placeholder="City"
                                    />

                                    <Text style={styles.infoLabel}>State:</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={addressData.state}
                                        onChangeText={(text) => setAddressData({ ...addressData, state: text })}
                                        placeholder="State"
                                    />

                                    <Text style={styles.infoLabel}>Zip Code:</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={addressData.zipCode}
                                        onChangeText={(text) => setAddressData({ ...addressData, zipCode: text })}
                                        placeholder="Zip code"
                                        keyboardType="numeric"
                                    />
                                </View>
                            ) : (
                                <View>
                                    {userProfile?.address ? (
                                        <View>
                                            <Text style={styles.infoValue}>
                                                {userProfile.address.street}
                                                {userProfile.address.apartment ? `, ${userProfile.address.apartment}` : ''}
                                            </Text>
                                            <Text style={styles.infoValue}>
                                                {userProfile.address.city}, {userProfile.address.state} {userProfile.address.zipCode}
                                            </Text>
                                            <Text style={styles.infoValue}>{userProfile.address.country}</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.infoValue}>No address provided</Text>
                                    )}
                                </View>
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
                                    style={{ marginTop: 10 }}
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
    },
    addressInputContainer: {
        marginBottom: 12,
    },
});