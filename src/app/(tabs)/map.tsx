import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapComponent } from '@/components/MapComponent';
import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { useTranslation } from '@/i18n';

export default function MapScreen() {
  const { t } = useTranslation();
  const { aggregateData, loading, error, refreshData } = useApp();
  const locations = aggregateData?.locations ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} colors={['#FF6200']} />
        }
        contentContainerStyle={styles.content}
      >
        <LinearGradient colors={['#F6F8FB', '#F0F6FF']} style={styles.gradientBg}>
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
    backgroundColor: '#F6F8FB',
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
    color: '#073763',
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
    color: '#073763',
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
    backgroundColor: '#FBFEFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1220',
    fontFamily: 'Inter_600SemiBold',
  },
  summaryCoords: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6200',
    fontFamily: 'Inter_700Bold',
  },
  errorBanner: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    margin: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});