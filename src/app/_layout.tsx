import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_300Light, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/i18n';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_300Light, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });

  // On web the page renders immediately with fallback fonts; native waits for fonts to avoid a flash.
  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.saffron} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AuthProvider>
          <AppProvider>
            <Slot />
          </AppProvider>
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper },
});
