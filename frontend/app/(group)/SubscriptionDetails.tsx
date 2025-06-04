import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import CredentialsContainer from '@/components/CredentialsContainer';

type SubscriptionDetailsData = {
    id: string;
    groupName: string;
    subscriptionName: string;
    planName: string;
    amount: number;
    cycle: string;
    currency: string;
    nextPaymentDate: string;
    subscription?: {
        id: string;
        name: string;
        logo: string;
        category: string;
        domain: string;
    };
    credentials?: {
        username: string;
        password: string;
    };
};

export default function SubscriptionDetailsScreen() {
    const API_URL = process.env.EXPO_PUBLIC_API_URL;
    const router = useRouter();
    const { groupId } = useLocalSearchParams();
    const [details, setDetails] = useState<SubscriptionDetailsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptionDetails();
    }, []);

    const fetchSubscriptionDetails = async () => {
        try {
            if (!groupId) {
                console.error('No groupId provided');
                return;
            }

            const response = await axios.get(`${API_URL}/api/groups/${groupId}/subscription-details`);
            setDetails(response.data);
        } catch (error) {
            console.error('Failed to fetch subscription details:', error);
            // For testing purposes, use mock data if API fails
            setMockData();
        } finally {
            setLoading(false);
        }
    };

    // Mock data for testing while backend is being developed
    const setMockData = () => {
        setDetails({
            id: '1',
            groupName: 'Netflix Group',
            subscriptionName: 'Netflix',
            planName: 'Premium Family',
            amount: 80.00,
            cycle: 'Monthly',
            currency: 'USD',
            nextPaymentDate: '2025-06-15',
            subscription: {
                id: '1',
                name: 'Netflix',
                logo: 'https://www.netflix.com/favicon.ico',
                category: 'Entertainment',
                domain: 'netflix.com'
            },
            credentials: {
                username: 'buonthienthu@gmail.com',
                password: 'thucuoi123'
            }
        });
    };

    const calculateDaysUntilPayment = () => {
        if (!details?.nextPaymentDate) return 0;
        const nextPayment = new Date(details.nextPaymentDate);
        const today = new Date();
        const diffTime = nextPayment.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Loading subscription details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!details) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text>Failed to load subscription details</Text>
                    <Pressable style={styles.retryButton} onPress={fetchSubscriptionDetails}>
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#4A3DE3" />
                    </Pressable>
                    <Text style={styles.title}>Subscription details</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Subscription Card */}
                <View style={styles.subscriptionCard}>
                    {details.subscription?.logo ? (
                        <Image source={{ uri: details.subscription.logo }} style={styles.logo} />
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>{details.subscriptionName.charAt(0)}</Text>
                        </View>
                    )}
                    <Text style={styles.serviceName}>{details.subscriptionName}</Text>
                    <Text style={styles.price}>${details.amount.toFixed(2)}</Text>
                    {details.subscription?.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{details.subscription.category}</Text>
                        </View>
                    )}
                </View>

                {/* Account Credentials Section */}
                <View style={styles.section}>
                    {details.credentials && (
                        <CredentialsContainer
                            email={details.credentials.username}
                            password={details.credentials.password}
                        />
                    )}
                </View>

                {/* Subscription Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subscription details</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Plan</Text>
                        <Text style={styles.detailValue}>{details.planName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Billing cycle</Text>
                        <Text style={styles.detailValue}>{details.cycle}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Next payment</Text>
                        <View>
                            <Text style={styles.detailValue}>
                                {new Date(details.nextPaymentDate).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </Text>
                            <Text style={styles.detailSubtext}>
                                In {calculateDaysUntilPayment()} days
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Payment History */}
                <Pressable style={styles.paymentHistoryButton}>
                    <Text style={styles.paymentHistoryText}>Payment history</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#4A3DE3',
        borderRadius: 8,
    },
    retryText: {
        color: 'white',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A3DE3',
    },
    subscriptionCard: {
        alignItems: 'center',
        paddingVertical: 32,
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: '#FAFAFA',
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 16,
    },
    logoPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4A3DE3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: '600',
    },
    serviceName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    warningText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    credentialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 12,
    },
    credentialIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    credentialInfo: {
        flex: 1,
    },
    credentialLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    credentialValue: {
        fontSize: 14,
        color: '#666',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'right',
    },
    detailSubtext: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: 2,
    },
    paymentHistoryButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    paymentHistoryText: {
        fontSize: 16,
        fontWeight: '500',
    },
});