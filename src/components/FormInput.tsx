import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'phone-pad';
  required?: boolean;
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  maxLength?: number;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  autoComplete?: 'email' | 'one-time-code' | 'password' | 'name' | 'off';
  onSubmitEditing?: () => void;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  required = false,
  error,
  style,
  inputStyle,
  labelStyle,
  maxLength,
  editable = true,
  autoCapitalize = 'words',
  secureTextEntry,
  autoComplete,
  onSubmitEditing,
}: FormInputProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, labelStyle]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        onSubmitEditing={onSubmitEditing}
        autoCorrect={false}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#0B1220',
    fontFamily: 'Inter_400Regular',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: '#FBFEFF',
    fontSize: 14,
    color: '#0B1220',
    fontFamily: 'Inter_400Regular',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 0,
    elevation: 0,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
});