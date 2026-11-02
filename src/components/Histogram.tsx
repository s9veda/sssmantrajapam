import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { DailyCount } from '@/types';

interface HistogramProps {
  data: DailyCount[];
  style?: ViewStyle;
}

export function Histogram({ data, style }: HistogramProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyText}>No submissions yet</Text>
      </View>
    );
  }

  const max = data.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  return (
    <View style={[styles.container, style]}>
      {data.map((row, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.label}>{row.date}</Text>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.round((row.count / max) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.count}>{row.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    width: 100,
    flexShrink: 0,
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  barWrapper: {
    flex: 1,
    height: 34,
    backgroundColor: '#EAF3FF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#FF6200',
    borderRadius: 10,
  },
  count: {
    width: 60,
    textAlign: 'right',
    fontWeight: '700',
    color: '#0B1220',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});