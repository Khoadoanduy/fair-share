import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DropdownOption {
    value: string;
    label: string;
    icon?: string;
}

interface CustomDropdownModalProps {
    visible: boolean;
    selectedValue: string;
    options: DropdownOption[];
    onSelect: (value: string) => void;
    onCustomPress?: () => void;
    header?: string;
    customPrompt?: string;
    customButtonLabel?: string;
}

const CustomDropdownModal: React.FC<CustomDropdownModalProps> = ({
    visible,
    selectedValue,
    options,
    onSelect,
    onCustomPress,
    header = 'Suggested',
    customPrompt = "Don't see what you're looking for?",
    customButtonLabel = 'Custom',
}) => {
    if (!visible) return null;

    return (
        <View style={styles.dropdown}>
            <Text style={styles.header}>{header}</Text>
            <View style={styles.optionsContainer}>
                {options.map(option => (
                    <Pressable
                        key={option.value}
                        style={[
                            styles.optionButton,
                            selectedValue === option.value && styles.optionButtonSelected
                        ]}
                        onPress={() => onSelect(option.value)}
                    >
                        {option.icon && (
                            <Ionicons
                                name={option.icon as any}
                                size={16}
                                color={selectedValue === option.value ? '#fff' : '#5E5AEF'}
                            />
                        )}
                        <Text style={[
                            styles.optionText,
                            selectedValue === option.value && styles.optionTextSelected
                        ]}>
                            {option.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
            {onCustomPress && (
                <View style={styles.customContainer}>
                    <Text style={styles.customPrompt}>{customPrompt}</Text>
                    <Pressable style={styles.customButton} onPress={onCustomPress}>
                        <Text style={styles.customButtonText}>{customButtonLabel}</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    dropdown: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 16,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        padding: 16,
        elevation: 10,
        maxHeight: 300,
    },
    header: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#5E5AEF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 80,
    },
    optionButtonSelected: {
        backgroundColor: '#5E5AEF',
        borderColor: '#5E5AEF',
    },
    optionText: {
        color: '#5E5AEF',
        fontSize: 14,
        marginLeft: 4,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: 'white',
    },
    customContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F1F1',
    },
    customPrompt: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    customButton: {
        backgroundColor: '#5E5AEF',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    customButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
});

export default CustomDropdownModal;
