import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface CustomInputModalProps {
    visible: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onCancel: () => void;
    onAdd: () => void;
    title?: string;
    subtitle?: string;
    placeholder?: string;
    addButtonLabel?: string;
    cancelButtonLabel?: string;
}

const CustomInputModal: React.FC<CustomInputModalProps> = ({
    visible,
    value,
    onChangeText,
    onCancel,
    onAdd,
    title = 'Add custom value',
    subtitle = 'Customize your input',
    placeholder = 'Enter value',
    addButtonLabel = 'Add',
    cancelButtonLabel = 'Cancel',
}) => {
    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modal}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>

                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#888"
                    value={value}
                    onChangeText={onChangeText}
                    autoFocus
                />

                <View style={styles.buttons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>{cancelButtonLabel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addButton} onPress={onAdd}>
                        <Text style={styles.addButtonText}>{addButtonLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        minWidth: 300,
        marginBottom: 150,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    addButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#5E5AEF',
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default CustomInputModal;
