import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileDrawer } from './ProfileDrawer';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';
import { colors } from '@/lib/theme';

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
        hitSlop={6}
        style={styles.profileButton}
        accessibilityRole="button"
        accessibilityLabel={t('profile.open')}
      >
        <Ionicons name="person-circle-outline" size={22} color={colors.white} />
        {user ? <View style={styles.onlineDot} /> : null}
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
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: colors.forest,
  },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.white },
  profileButton: { width: 38, height: 38, borderRadius: 19, marginLeft: 12, backgroundColor: colors.forestSoft, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', right: 1, bottom: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.online, borderWidth: 1.5, borderColor: colors.forest },
});
