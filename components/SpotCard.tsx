import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Spot, WeatherSnapshot } from '../types/spot';
import { getPrimaryThemeMeta } from '../constants/themes';
import { scoreWeather } from '../lib/recommendation';
import { ScoreBadge } from './ScoreBadge';
import { colors } from '../constants/colors';
import { radius, spacing, fontSize } from '../constants/typography';

interface Props {
  spot: Spot;
  weather?: WeatherSnapshot;
  distanceKm?: number;
  onPress: () => void;
}

export function SpotCard({ spot, weather, distanceKm, onPress }: Props) {
  const primaryTheme = getPrimaryThemeMeta(spot.themes);
  const score = weather ? scoreWeather(weather) : null;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={primaryTheme.icon} size={22} color={primaryTheme.color} />
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {spot.name}
          </Text>
          {distanceKm !== undefined && (
            <Text style={styles.distance}>{distanceKm.toFixed(1)}km</Text>
          )}
        </View>
        <Text style={styles.region}>{spot.region}</Text>
        <Text style={styles.note} numberOfLines={1}>
          {spot.bestTimeNote}
        </Text>
        {score && (
          <View style={{ marginTop: spacing.sm }}>
            <ScoreBadge score={score.score} label={score.label} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  distance: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  region: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
