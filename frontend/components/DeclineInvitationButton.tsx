import axios from 'axios';
import CustomButton from './CustomButton';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const API_URL = process.env.EXPO_PUBLIC_API_URL;

type DeclineButtonProps = {
    userId: string;
    groupId: string;
    disabled?: boolean;
    onResponse?: () => void;
};

const DeclineInvitationButton = ({ userId, groupId, disabled, onResponse }: DeclineButtonProps) => {
    const [declined, setDeclined] = useState(false);
    const handleDecline = async () => {
        try {
            await axios.delete(`${API_URL}/api/invite/${groupId}/${userId}`);
            setDeclined(true);
            onResponse?.();
            console.log('Decline and remove invitation successfully');
        } catch (error) {
            console.log('Error declining invitation: ', error);
        }
    };

    return <CustomButton
        text={declined ? "Declined" : "Decline"}
        onPress={handleDecline}
        rightIcon={declined ? <Ionicons name="close" size={20} color="#94A3B8" /> : undefined}
        disabled={disabled}
        style={[declined ? styles.buttonDeclined : styles.buttonActive, styles.button]}
        textStyle={declined ? styles.textDeclined : styles.text} />;
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonActive: {
        backgroundColor: '#4A3DE31A',
    },
    buttonDeclined: {
        backgroundColor: '#E2E8F0',
    },
    text: {
        color: '#4A3DE3'
    },
    textDeclined: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DeclineInvitationButton;