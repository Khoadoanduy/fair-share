import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DeleteModal from './DeleteModal';

interface SubscriptionCardProps {
    mode: 'feed' | 'postings'; // Explicitly define the mode
    friend: {
        id: string;
        firstName: string;
        lastName: string;
    };
    group: {
        id: string;
        groupName: string;
        subscriptionName: string;
        amount: number;
        cycleDays: number;
        totalMem: number;
        amountEach: number;
        subscription?: {
            logo: string;
        };
        timeAgo: string;
    };
    message: string;
    hasRequested?: boolean;
    userRole?: string;
    onJoinRequest?: (groupId: string, groupName: string) => void;
    onDeletePosting?: (groupId: string, groupName: string) => void;
    isJoining?: boolean;
}

// Helper functions
const getInitials = (firstName: string, lastName: string) => `${firstName[0]}${lastName[0]}`.toUpperCase();

const getAvatarColor = (userId: string) => {
    const colors = ['#FF5733', '#33A8FF', '#9333FF', '#33FF57', '#FF33F5', '#33FFF5'];
    return colors[userId.charCodeAt(0) % colors.length];
};

const formatCycle = (cycleDays: number) => {
    if (cycleDays <= 7) return 'weekly';
    if (cycleDays <= 31) return 'monthly';
    return 'yearly';
};

export default function SubscriptionCard({
    mode,
    friend,
    group,
    message,
    hasRequested = false,
    userRole,
    onJoinRequest,
    onDeletePosting,
    isJoining = false
}: SubscriptionCardProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeletePosting = () => {
        setShowDropdown(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setShowDeleteModal(false);
        onDeletePosting?.(group.id, group.groupName);
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(friend.id) }]}>
                    <Text style={styles.initials}>
                        {getInitials(friend.firstName, friend.lastName)}
                    </Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.name}>
                        {friend.firstName} {friend.lastName}
                    </Text>
                    {group.timeAgo && (
                        <Text style={styles.timeAgo}>{group.timeAgo}</Text>
                    )}
                </View>

                {/* Role Badge and Actions for postings */}
                {mode === 'postings' && (
                    <>
                        {userRole && (
                            <View style={[styles.roleBadge, { backgroundColor: userRole === 'leader' ? '#4A3DE3' : '#666' }]}>
                                <Text style={styles.roleBadgeText}>
                                    {userRole === 'leader' ? '👑 Leader' : '👤 Member'}
                                </Text>
                            </View>
                        )}

                        <View style={styles.dropdownContainer}>
                            <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => setShowDropdown(!showDropdown)}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                            </TouchableOpacity>

                            {showDropdown && (
                                <View style={styles.dropdown}>
                                    <TouchableOpacity
                                        style={styles.dropdownItem}
                                        onPress={handleDeletePosting}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#ff4444" />
                                        <Text style={styles.dropdownText}>Delete posting</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </View>

            <Text style={styles.activity}>{message}</Text>

            {/* Subscription Card */}
            <View style={styles.subscriptionCard}>
                <View style={styles.subscriptionHeader}>
                    {group.subscription?.logo && (
                        <Image
                            source={{ uri: group.subscription.logo }}
                            style={styles.subscriptionLogo}
                        />
                    )}
                    <View style={styles.subscriptionDetails}>
                        <Text style={styles.subscriptionName}>{group.subscriptionName}</Text>
                        <Text style={styles.subscriptionCycle}>
                            {formatCycle(group.cycleDays)}
                        </Text>
                    </View>
                    <View style={styles.priceSection}>
                        <Text style={styles.estimatedText}>Estimated</Text>
                        <Text style={styles.priceText}>${group.amountEach?.toFixed(2) || group.amount.toFixed(2)}</Text>
                        <Text style={styles.savingText}>Saving from ${group.amount.toFixed(2)}!</Text>
                    </View>
                </View>

                <View style={styles.slotsInfo}>
                    <Text style={styles.slotsText}>{group.totalMem} members</Text>
                </View>
            </View>

            {/* Join Button for feed only */}
            {mode === 'feed' && (
                <TouchableOpacity
                    style={[
                        styles.joinButton,
                        (isJoining || hasRequested) && styles.joinButtonDisabled
                    ]}
                    onPress={() => onJoinRequest?.(group.id, group.groupName)}
                    disabled={isJoining || hasRequested}
                >
                    {isJoining ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.joinButtonText}>
                            {hasRequested ? "Requested" : "Request to join"}
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            <DeleteModal
                visible={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onDelete={confirmDelete}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    initials: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerText: {
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#000',
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    activity: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
        color: '#333',
    },
    roleBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginRight: 8,
    },
    roleBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    dropdownContainer: {
        position: 'relative',
    },
    moreButton: {
        padding: 4,
    },
    dropdown: {
        position: 'absolute',
        top: 30,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
        minWidth: 140,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    dropdownText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#000',
    },
    subscriptionCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    subscriptionLogo: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: 12,
    },
    subscriptionDetails: {
        flex: 1,
    },
    subscriptionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A3DE3',
        marginBottom: 4,
    },
    subscriptionCycle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    estimatedText: {
        fontSize: 10,
        color: '#999',
        textTransform: 'uppercase',
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    savingText: {
        fontSize: 10,
        color: '#4A3DE3',
        marginTop: 2,
    },
    slotsInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slotsText: {
        fontSize: 12,
        color: '#666',
    },
    joinButton: {
        backgroundColor: '#4A3DE3',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
    },
    joinButtonDisabled: {
        backgroundColor: '#ccc',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});