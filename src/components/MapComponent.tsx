import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LocationData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

interface MapComponentProps {
  locations: LocationData[];
  style?: ViewStyle;
  t: (key: string) => string;
}

export function MapComponent({ locations, style, t }: MapComponentProps) {
  if (locations.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Ionicons name="map-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyText}>{t('map.noLocations')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.locationCount}>
          {locations.length} {t('map.locations')}
        </Text>
        <Text style={styles.totalChants}>
          {locations.reduce((sum, loc) => sum + loc.count, 0).toLocaleString()} {t('map.chants')}
        </Text>
      </View>
      
      <View style={styles.list}>
        {locations.slice(0, 10).map((item, index) => (
          <TouchableOpacity key={index} style={styles.locationItem} activeOpacity={0.7}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>
                {item.city && item.country ? `${item.city}, ${item.country}` : (item.country || t('map.noLocations'))}
              </Text>
              <Text style={styles.locationCoords}>
                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            </View>
            <View style={styles.locationCountBadge}>
              <Text style={styles.locationCountText}>{item.count}</Text>
              <Text style={styles.chantsLabel}>{t('map.chants')}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {locations.length > 10 && (
          <Text style={styles.moreText}>
            ... {locations.length - 10} more locations
          </Text>
        )}
      </View>
      
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
        <Text style={styles.noteText}>
          Full interactive map available in development build (npx expo run:ios/android)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 360,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
  },
  emptyContainer: {
    height: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sage,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  locationCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
  },
  totalChants: {
    fontSize: 14,
    color: colors.saffron,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  list: {
    maxHeight: 240,
    gap: 8,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    fontFamily: 'Inter_600SemiBold',
  },
  locationCoords: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  locationCountBadge: {
    alignItems: 'flex-end',
  },
  locationCountText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.saffron,
    fontFamily: 'Inter_700Bold',
  },
  chantsLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'Inter_400Regular',
  },
  moreText: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  noteText: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});