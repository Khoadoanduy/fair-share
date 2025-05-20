import { Pressable, Text, StyleSheet, PressableProps, TextStyle } from 'react-native';

type CustomButtonProps = {
  text: string;
  textStyle?: TextStyle;
} & PressableProps;

export default function CustomButton({ text, textStyle, ...props }: CustomButtonProps) {
  return (
    <Pressable {...props} style={[styles.button, props.style]}>
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
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
