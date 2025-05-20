import { Pressable, Text, StyleSheet, PressableProps, TextStyle } from 'react-native';

type CustomButtonProps = {
  text: string;
  textStyle?: TextStyle | TextStyle[];
} & PressableProps;

export default function CustomButton({ text, textStyle, style, ...props }: CustomButtonProps) {
  return (
    <Pressable 
      {...props} 
      style={(state) => {
        const baseStyle = [styles.button];
        if (typeof style === 'function') {
          return [...baseStyle, style(state)];
        }
        return [...baseStyle, style];
      }}
    >
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