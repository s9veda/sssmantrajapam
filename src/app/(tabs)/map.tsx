import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapComponent } from '@/components/MapComponent';
import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/i18n';
import { colors } from '@/lib/theme';

// The map is hidden from navigation; it opens only on web with ?map=1.
export default function MapScreen() {
  const { map } = useLocalSearchParams<{ map?: string }>();
  if (Platform.OS !== 'web' || map !== '1') return <Redirect href="/" />;
  return <MapContent />;
}

function MapContent() {
  const { t } = useTranslation();
  const { aggregateData, loading, error, refreshData } = useApp();
  const locations = aggregateData?.locations ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} colors={[colors.saffron]} />
        }
        contentContainerStyle={styles.content}
      >
        <LinearGradient colors={[colors.paper, colors.sage]} style={styles.gradientBg}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('map.title')}</Text>
          </View>

          <Card variant="map" style={styles.mapCard} padding={0}>
            <MapComponent locations={locations} t={t} />
          </Card>

          {locations.length > 0 && (
            <Card variant="map" style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{t('map.locationSummary')}</Text>
              <View style={styles.summaryList}>
                {locations.map((loc, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <View style={styles.summaryInfo}>
                      <Text style={styles.summaryLocation}>
                        {loc.city && loc.country ? `${loc.city}, ${loc.country}` : (loc.country || t('map.noLocations'))}
                      </Text>
                      <Text style={styles.summaryCoords}>
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </Text>
                    </View>
                    <Text style={styles.summaryCount}>{loc.count} {t('map.chants')}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </LinearGradient>
      </ScrollView>

      {error && !loading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  gradientBg: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.forest,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  mapCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.forest,
    marginBottom: 12,
    fontFamily: 'Inter_700Bold',
  },
  summaryList: {
    gap: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
  },
  summaryCoords: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.saffron,
    fontFamily: 'Inter_700Bold',
  },
  errorBanner: {
    padding: 16,
    backgroundColor: colors.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.errorLine,
    margin: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});