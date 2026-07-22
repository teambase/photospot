import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import type { Spot, WeatherSnapshot } from '../types/spot';
import { getThemeMeta } from '../constants/themes';
import { scoreWeather } from '../lib/recommendation';
import { getCameraSettings } from '../lib/cameraSettings';
import { ScoreBadge } from './ScoreBadge';
import { CameraSettingCard } from './CameraSettingCard';
import { colors } from '../constants/colors';
import { spacing, fontSize, radius } from '../constants/typography';

interface Props {
  spot: Spot;
  weather?: WeatherSnapshot;
}

export function SpotDetailSheet({ spot, weather }: Props) {
  const score = weather ? scoreWeather(weather) : null;
  const cameraSetting = getCameraSettings(spot.themes[0], weather)[0];

  return (
    <BottomSheetView style={styles.container}>
      <View style={styles.themeRow}>
        {spot.themes.map((id) => {
          const t = getThemeMeta(id);
          return (
            <View key={id} style={styles.themeBadge}>
              <Ionicons name={t.icon} size={13} color={t.color} />
              <Text style={styles.themeBadgeText}>{t.label}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.name}>{spot.name}</Text>
      <Text style={styles.region}>{spot.region}</Text>

      {score && (
        <View style={{ marginTop: spacing.sm }}>
          <ScoreBadge score={score.score} label={score.label} />
        </View>
      )}

      <Text style={styles.description}>{spot.description}</Text>

      {weather && (
        <View style={styles.weatherGrid}>
          <WeatherStat label="하늘" value={weather.sky} />
          <WeatherStat label="일몰" value={weather.sunsetTime} />
          <WeatherStat label="구름량" value={`${weather.cloudCoverPercent}%`} />
          <WeatherStat label="미세먼지" value={weather.dustGrade} />
        </View>
      )}

      <View style={{ marginTop: spacing.lg }}>
        {cameraSetting && <CameraSettingCard setting={cameraSetting} />}
      </View>

      <Pressable
        style={styles.detailButton}
        onPress={() => router.push(`/spot/${spot.id}`)}
      >
        <Text style={styles.detailButtonText}>스팟 자세히 보기</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.white} />
      </Pressable>
    </BottomSheetView>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.weatherStat}>
      <Text style={styles.weatherLabel}>{label}</Text>
      <Text style={styles.weatherValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  themeBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textPrimary },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  region: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  description: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  weatherStat: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  weatherLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  weatherValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.black,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  detailButtonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },
});
