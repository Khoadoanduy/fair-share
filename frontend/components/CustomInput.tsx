import {
  TextInput,
  StyleSheet,
  TextInputProps,
  Text,
  View,
} from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

type CustomInputProps<T extends FieldValues> = {
  control: Control<T>; // custom fields
  name: Path<T>;
} & TextInputProps;

export default function CustomInput<T extends FieldValues>({
  control,
  name,
  ...props
}: CustomInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => (
        <View style={styles.container}>
          <TextInput
            {...props}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor="#888"
            style={[
              styles.input,
              props.style,
              { borderColor: error ? "crimson" : "gray" },
            ]}
          />
          {error ? (
            <Text style={styles.error}>{error.message}</Text>
          ) : (
            <View style={{ height: 18 }} />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: "#ccc",
    color: "#000", // Ensuring text is black for good contrast
    fontSize: 16, // Slightly larger text for better readability
  },
  error: {
    color: "crimson",
    minHeight: 18,
  },
});
