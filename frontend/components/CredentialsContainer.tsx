import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CredentialsVisibilityToggle from './CredentialsVisibilityToggle';
import CredentialItem from './CredentialItem';

type CredentialsContainerProps = {
    email: string;
    password: string;
};

export default function CredentialsContainer({ email, password }: CredentialsContainerProps) {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Account credentials</Text>
                <CredentialsVisibilityToggle
                    isVisible={isVisible}
                    onToggle={toggleVisibility}
                />
            </View>
            <Text style={styles.warning}>Do not share your credentials with others.</Text>

            <View style={styles.credentialsBox}>
                <CredentialItem
                    iconName="person"
                    label="Username/Email"
                    value={email}
                    isVisible={isVisible}
                    type="email"
                />

                <CredentialItem
                    iconName="lock-closed"
                    label="Password"
                    value={password}
                    isVisible={isVisible}
                    type="password"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 19,
        fontWeight: '600',
    },
    warning: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    credentialsBox: {
        borderRadius: 8,
        backgroundColor: '#F9F9F9',
        padding: 12,
    }
});