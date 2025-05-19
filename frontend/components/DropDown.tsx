import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';

type Option = { label: string; value: string };

type DropdownProps = {
  options: Option[];
  selectedValue?: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  style?: object;
  dropdownStyle?: object;
  textStyle?: object;
};

export default function Dropdown({
  options,
  selectedValue,
  placeholder = 'Select',
  onSelect,
  style,
  dropdownStyle,
  textStyle,
}: DropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={styles.trigger}
        onPress={() => setVisible(!visible)}
      >
        <Text style={[styles.text, textStyle]}>
          {selectedValue
            ? options.find(opt => opt.value === selectedValue)?.label
            : placeholder}
        </Text>
      </Pressable>

      {visible && (
        <View style={[styles.dropdown, dropdownStyle]}>
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onSelect(item.value);
                  setVisible(false);
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  trigger: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  text: { fontSize: 16, color: '#000' },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 10,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
  },
});
