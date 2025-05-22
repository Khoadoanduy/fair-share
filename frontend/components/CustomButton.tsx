import { Pressable, Text, StyleSheet, PressableProps, TextStyle, ViewStyle, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';

type CustomButtonProps = {
  text: string;
  textStyle?: TextStyle | TextStyle[];
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: ViewStyle;
} & PressableProps;

export default function CustomButton({
  text,
  textStyle,
  style,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  containerStyle,
  ...props
}: CustomButtonProps) {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'outline':
        return styles.buttonOutline;
      case 'text':
        return styles.buttonText;
      default:
        return styles.buttonPrimary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.buttonSmall;
      case 'large':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.textOutline;
      case 'text':
        return styles.textPlain;
      default:
        return styles.textStandard;
    }
  };

  return (
    <View style={[fullWidth && styles.fullWidth, containerStyle]}>
      <Pressable
        {...props}
        disabled={disabled || loading}
        style={(state) => {
          const baseStyle = [
            styles.button,
            getVariantStyle(),
            getSizeStyle(),
            fullWidth && styles.fullWidth,
            disabled && styles.buttonDisabled,
          ];

          if (typeof style === 'function') {
            return [...baseStyle, style(state)];
          }
          return [...baseStyle, style];
        }}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'text' ? '#4A3DE3' : 'white'} />
        ) : (
          <View style={styles.buttonContent}>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text
              style={[
                getTextStyle(),
                textStyle,
                disabled && styles.textDisabled
              ]}
            >
              {text}
            </Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#5E5AEF',
  },
  buttonSecondary: {
    backgroundColor: '#E2E8F0',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#5E5AEF',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  buttonSmall: {
    paddingVertical: 10,    // Increased from 8
    paddingHorizontal: 18,  // Increased from 16
  },
  buttonMedium: {
    paddingVertical: 14,    // Increased from 12
    paddingHorizontal: 26,  // Increased from 24
  },
  buttonLarge: {
    paddingVertical: 18,    // Increased from 16
    paddingHorizontal: 34,  // Increased from 32
    height: 50,             // Added explicit height
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#E2E8F0',
  },
  fullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStandard: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  textOutline: {
    color: '#5E5AEF',
    fontSize: 16,
    fontWeight: '600',
  },
  textPlain: {
    color: '#5E5AEF',
    fontSize: 16,
    fontWeight: '600',
  },
  textDisabled: {
    color: '#94A3B8',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});