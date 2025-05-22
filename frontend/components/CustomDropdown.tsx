import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DropdownOption = {
  label: string;
  value: string;
};

interface CustomDropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: () => void;
  style?: ViewStyle | ViewStyle[];
  menuStyle?: ViewStyle;
  iconSize?: number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  options, 
  value, 
  placeholder, 
  onChange, 
  isOpen, 
  setIsOpen, 
  style, 
  menuStyle,
  iconSize = 20
}) => (
  <>
    <Pressable
      style={[styles.dropdownBase, style]}
      onPress={setIsOpen}
    >
      <Text style={[styles.dropdownValue, !value && styles.placeholderText]}>
        {value ? options.find(opt => opt.value === value)?.label : placeholder}
      </Text>
      <Ionicons name="chevron-down" size={iconSize} color="#888" />
    </Pressable>

    {isOpen && (
      <View style={[styles.dropdownMenuBase, menuStyle]}>
        {options.map(option => (
          <Pressable
            key={option.value}
            style={styles.dropdownItem}
            onPress={() => {
              onChange(option.value);
              setIsOpen();
            }}
          >
            <Text style={styles.dropdownText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    )}
  </>
);

const styles = StyleSheet.create({
  dropdownBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    height: 50,
  },
  dropdownValue: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  dropdownMenuBase: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    padding: 8,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomDropdown;