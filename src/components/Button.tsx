import React, { ReactNode, isValidElement, cloneElement } from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const sizeStyles = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, gap: 6 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15, gap: 8 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17, gap: 10 },
} as const;

const gradientColors = {
  primary: ['#FF6200', '#FF9F6F'] as const,
  secondary: ['#1075B9', '#10B981'] as const,
  outline: ['transparent', 'transparent'] as const,
};

const textColors = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  outline: '#FF6200',
};

const borderStyles = {
  primary: { borderWidth: 0 },
  secondary: { borderWidth: 0 },
  outline: { borderWidth: 2, borderColor: '#FF6200' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  style,
  textStyle,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const currentSizeStyles = sizeStyles[size];
  const currentGradientColors = gradientColors[variant];
  const currentTextColor = textColors[variant];
  const currentBorderStyles = borderStyles[variant];

  const content = (
    <View style={[
      styles.content,
      { gap: currentSizeStyles.gap },
    ]}>
      {loading ? (
        <Text style={[
          styles.buttonText,
          { fontSize: currentSizeStyles.fontSize, fontWeight: '700' as const, color: currentTextColor },
          textStyle,
        ]}>
          Loading...
        </Text>
      ) : (
        React.Children.map(children, (child) => {
          if (isValidElement(child)) {
            const childElement = child as React.ReactElement<any>;
            return cloneElement(childElement, {
              style: [
                { color: currentTextColor, fontSize: currentSizeStyles.fontSize, fontWeight: '700' as const, fontFamily: 'Inter_700Bold' },
                childElement.props.style,
              ],
            });
          }
          return (
            <Text style={[
              styles.buttonText,
              { fontSize: currentSizeStyles.fontSize, fontWeight: '700' as const, color: currentTextColor },
              textStyle,
            ]}>
              {child}
            </Text>
          );
        })
      )}
    </View>
  );

  const buttonBaseStyle = [
    styles.button,
    { paddingVertical: currentSizeStyles.paddingVertical, paddingHorizontal: currentSizeStyles.paddingHorizontal },
    { opacity: isDisabled ? 0.6 : 1 },
    style,
  ];

  if (variant === 'outline') {
    return (
      <Pressable
        style={[
          ...buttonBaseStyle,
          currentBorderStyles,
        ]}
        onPress={onPress}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <LinearGradient
      colors={currentGradientColors}
      style={buttonBaseStyle}
    >
      <Pressable
        style={styles.pressableFill}
        onPress={onPress}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#0F62FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4,
  },
  pressableFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_700Bold',
  },
});