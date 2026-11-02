import React from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: 'default' | 'dashboard' | 'map';
}

export function Card({ children, style, padding = 16, variant = 'default' }: CardProps) {
  const backgroundStyles = {
    default: { backgroundColor: 'rgba(255, 255, 255, 0.98)' },
    dashboard: { backgroundColor: 'rgba(245, 245, 245, 1)' },
    map: { backgroundColor: 'rgba(255, 255, 255, 0.98)' },
  };

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.98)', 'rgba(246, 250, 255, 0.98)']}
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
    borderColor: '#E6EEF8',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
});