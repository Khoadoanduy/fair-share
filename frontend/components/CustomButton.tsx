import { Pressable, Text, StyleSheet, PressableProps, ViewStyle, StyleProp } from 'react-native';

type CustomButtonProps = {
  text: string;
  textStyle?: object;
  style?: StyleProp<ViewStyle>;
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
    backgroundColor: '#4353FD', 
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
