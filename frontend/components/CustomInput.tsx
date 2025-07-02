import React from 'react';
import { TextInput, StyleSheet, Text, View, TextInputProps } from 'react-native';
import { Controller } from 'react-hook-form';

interface CustomInputProps extends TextInputProps {
  control: any;
  name: string;
  rules?: any;
  placeholder: string;
  secureTextEntry?: boolean;
  style?: any;
}

const CustomInput = ({
  control,
  name,
  rules = {},
  placeholder,
  secureTextEntry,
  style,
  ...otherProps
}: CustomInputProps) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <>
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={secureTextEntry}
            autoCorrect={false}
            style={[styles.input, error && styles.inputError, style]}
            {...otherProps}
          />
          {error && <Text style={styles.error}>{error.message}</Text>}
        </>
      )}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    position: 'absolute',
    top: 55.5, // Position from top instead of bottom
    left: 0,
    width: '100%', // Allow text to use full width
    flexWrap: 'wrap', // Enable text wrapping
    lineHeight: 15, // Improve line spacing for wrapped text
  },
});

export default CustomInput;
