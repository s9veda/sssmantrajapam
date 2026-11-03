import React from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: 'default' | 'dashboard' | 'map';
}

export function Card({ children, style, padding = 16, variant = 'default' }: CardProps) {
  const backgroundStyles = {
    default: { backgroundColor: colors.surface },
    dashboard: { backgroundColor: colors.paper },
    map: { backgroundColor: colors.surface },
  };

  return (
    <LinearGradient
      colors={[colors.surface, colors.paper]}
      style={[
        styles.card,
        { padding },
        backgroundStyles[variant],
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
});