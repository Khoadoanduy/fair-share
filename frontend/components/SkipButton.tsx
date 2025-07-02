import React from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

interface SkipButtonProps {
    to: string;
    params?: Record<string, any>;
    label?: string;
}

export default function SkipButton({ to, params, label = 'Skip' }: SkipButtonProps) {
    const router = useRouter();
    return (
        <Pressable
            onPress={() => {
                router.push({ pathname: to as any, params });
            }}
            style={{ paddingHorizontal: 12 }}
        >
            <Text style={{ fontSize: 16, color: '#666' }}>{label}</Text>
        </Pressable>
    );
}
