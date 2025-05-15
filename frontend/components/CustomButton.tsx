import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';

type CustomButtonProps = {
  text: string;
} & PressableProps;

export default function CustomButton({ text, ...props }: CustomButtonProps) {
  return (
    <Pressable {...props} style={[styles.button, props.style]}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4A3DE3',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
