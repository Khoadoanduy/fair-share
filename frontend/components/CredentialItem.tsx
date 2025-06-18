import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

type CredentialItemProps = {
    iconName: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    isVisible: boolean;
    onCopy?: () => void;
    type: 'email' | 'password' | 'text';
};

export default function CredentialItem({
    iconName,
    label,
    value,
    isVisible,
    onCopy,
    type
}: CredentialItemProps) {
    // Generate displayed value based on visibility and type
    const getDisplayValue = () => {
        if (isVisible) {
            return value;
        }

        switch (type) {
            case 'email':
                return maskEmail(value);
            case 'password':
                return '•'.repeat(value.length);
            default:
                return value;
        }
    };

    // Function to mask email (first letter + dots + domain)
    const maskEmail = (email: string) => {
        const atIndex = email.indexOf('@');
        if (atIndex <= 1) return email; // Don't mask if no @ or first letter is @

        const firstChar = email.charAt(0);
        const domain = email.substring(atIndex);
        const dotsCount = Math.min(10, atIndex - 1); // Limit dots for aesthetics

        return `${firstChar}${'•'.repeat(dotsCount)}${domain}`;
    };

    const handleCopy = async () => {
        if (isVisible) {
            await Clipboard.setStringAsync(value);
            Alert.alert('Copied', `${label} copied to clipboard`);
            if (onCopy) onCopy();
        } else {
            Alert.alert('Show credentials', 'Please show credentials before copying');
        }
    };

    return (
        <View style={styles.credentialItem}>
            <View style={styles.credentialIcon}>
                <Ionicons name={iconName} size={20} color="white" />
            </View>
            <View style={styles.credentialInfo}>
                <Text style={styles.credentialLabel}>{label}</Text>
                <Text style={styles.credentialValue}>{getDisplayValue()}</Text>
            </View>
            <Pressable onPress={handleCopy} style={styles.copyIcon}>
                <Ionicons name="copy-outline" size={20} color="#AAAAAA" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    credentialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginVertical: 6,
    },
    credentialIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6C63FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    credentialInfo: {
        flex: 1,
    },
    credentialLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    credentialValue: {
        fontSize: 14,
        color: '#666666',
    },
    copyIcon: {
        padding: 6,
    }
});