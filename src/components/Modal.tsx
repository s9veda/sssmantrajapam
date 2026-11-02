import React from 'react';
import { Text, StyleSheet, Pressable, Modal as RNModal, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionButton?: {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'primary' | 'secondary';
  };
  message?: string;
  messageType?: 'success' | 'error' | 'info';
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  actionButton,
  message,
  messageType = 'info',
}: ModalProps) {
  if (!visible) return null;

  const messageColors = {
    success: '#10B981',
    error: '#EF4444',
    info: '#6B7280',
  };

  return (
    <RNModal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalContainer} onPress={onClose} accessibilityLabel="Close modal">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
          keyboardVerticalOffset={0}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.98)', 'rgba(246, 250, 255, 0.98)']}
            style={styles.modalContent}
          >
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityLabel="Close">
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>

            <Text style={styles.title}>{title}</Text>

            {children}

            {message && (
              <Text style={[styles.message, { color: messageColors[messageType] }]}>
                {message}
              </Text>
            )}

            {actionButton && (
              <Button
                variant={actionButton.variant || 'primary'}
                size="md"
                loading={actionButton.loading}
                onPress={actionButton.onPress}
                style={styles.actionButton}
              >
                {actionButton.title}
              </Button>
            )}
          </LinearGradient>
        </KeyboardAvoidingView>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(3, 7, 18, 0.35)',
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 520,
  },
  modalContent: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(11, 18, 32, 0.03)',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 50,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    lineHeight: 22,
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#073763',
    marginBottom: 6,
    fontFamily: 'Inter_700Bold',
  },
  message: {
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  actionButton: {
    marginTop: 16,
    width: '100%',
  },
});