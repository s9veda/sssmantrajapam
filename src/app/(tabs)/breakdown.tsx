import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/Card';
import { Histogram } from '@/components/Histogram';
import { useApp } from '@/context/AppContext';
import { DailyCount } from '@/types';
import { useTranslation } from '@/i18n';

export default function BreakdownScreen() {
  const { t } = useTranslation();
  const { aggregateData, loading, error, refreshData } = useApp();
  const daily = aggregateData?.daily ?? [];

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
            <Text style={styles.title}>{t('breakdown.title')}</Text>
          </View>

          <Card variant="dashboard" style={styles.breakdownCard}>
            <Histogram data={daily as DailyCount[]} />
          </Card>

          {daily.length > 0 && (
            <Card variant="dashboard" style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{t('breakdown.summary')}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('breakdown.totalDays')}</Text>
                  <Text style={styles.summaryValue}>{daily.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('breakdown.totalChants')}</Text>
                  <Text style={styles.summaryValue}>
                    {daily.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('breakdown.dailyAverage')}</Text>
                  <Text style={styles.summaryValue}>
                    {Math.round(daily.reduce((sum, d) => sum + d.count, 0) / daily.length).toLocaleString()}
                  </Text>
                </View>
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
  breakdownCard: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#073763',
    marginBottom: 16,
    fontFamily: 'Inter_700Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1220',
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