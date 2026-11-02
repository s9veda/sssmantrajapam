import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileDrawer } from './ProfileDrawer';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title} numberOfLines={1}>{t('app.title')}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={styles.profileButton}
        accessibilityRole="button"
        accessibilityLabel={t('profile.open')}
      >
        <Ionicons name={user ? 'person-circle' : 'person-circle-outline'} size={32} color="#FF6200" />
      </Pressable>
      {open && <ProfileDrawer onClose={() => setOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEF8',
  },
  title: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', color: '#111827' },
  profileButton: { marginLeft: 12 },
});
