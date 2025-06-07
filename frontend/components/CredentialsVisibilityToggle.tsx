import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CredentialsVisibilityToggleProps = {
    isVisible: boolean;
    onToggle: () => void;
    size?: number;
};

export default function CredentialsVisibilityToggle({
    isVisible,
    onToggle,
    size = 24
}: CredentialsVisibilityToggleProps) {
    return (
        <Pressable
            style={styles.container}
            onPress={onToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons
                name={isVisible ? "eye-outline" : "eye-off-outline"}
                size={size}
                color="#333"
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 8,
    }
});