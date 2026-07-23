import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSpot } from '../../lib/spotsQueries';
import { useWeather } from '../../lib/weatherQueries';
import { getThemeMeta } from '../../constants/themes';
import { scoreWeather } from '../../lib/recommendation';
import { getCameraSettings } from '../../lib/cameraSettings';
import { getWindTip } from '../../lib/windAdvice';
import { ScoreBadge } from '../../components/ScoreBadge';
import { CameraSettingCard } from '../../components/CameraSettingCard';
import { colors } from '../../constants/colors';
import { spacing, fontSize, radius } from '../../constants/typography';

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: spot, isLoading } = useSpot(id);
  const { data: weather } = useWeather(spot);

  if (isLoading) {
    return <SafeAreaView style={styles.center} />;
  }

  if (!spot) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFound}>스팟 정보를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const score = weather ? scoreWeather(weather) : null;
  const cameraSettings = spot.themes.flatMap((t) => getCameraSettings(t, weather));

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={12}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.themeRow}>
            {spot.themes.map((tid) => {
              const t = getThemeMeta(tid);
              return (
                <View key={tid} style={styles.themeBadge}>
                  <Ionicons name={t.icon} size={13} color={t.color} />
                  <Text style={styles.themeBadgeText}>{t.label}</Text>
                </View>
              );
            })}
          </View>
          {score && <ScoreBadge score={score.score} label={score.label} />}
        </View>

        <Text style={styles.name}>{spot.name}</Text>
        <Text style={styles.region}>{spot.region}</Text>

        <Text style={styles.description}>{spot.description}</Text>

        <InfoRow icon="time-outline" label="추천 타이밍" value={spot.bestTimeNote} />
        {spot.azimuthNote && (
          <InfoRow icon="compass-outline" label="방향 팁" value={spot.azimuthNote} />
        )}

        {weather && (
          <>
            <View style={styles.weatherGrid}>
              <WeatherStat label="일출" value={weather.sunriseTime} />
              <WeatherStat label="일몰" value={weather.sunsetTime} />
              <WeatherStat label="하늘 상태" value={weather.sky} />
              <WeatherStat label="구름량" value={`${weather.cloudCoverPercent}%`} />
              <WeatherStat label="강수확률" value={`${weather.precipitationChance}%`} />
              <WeatherStat label="미세먼지" value={weather.dustGrade} />
              <WeatherStat label="현재 풍속" value={`${weather.windSpeedMs}m/s`} />
              <WeatherStat label="풍향" value={`${weather.windDirection}풍`} />
            </View>
            <View style={styles.windTipCard}>
              <Ionicons name="bulb-outline" size={16} color={colors.textPrimary} />
              <Text style={styles.windTipText}>{getWindTip(weather.windSpeedMs)}</Text>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>카메라 세팅 조언</Text>
        <View style={{ gap: spacing.md }}>
          {cameraSettings.map((setting, i) => (
            <CameraSettingCard key={`${setting.condition}-${i}`} setting={setting} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFound: { color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  themeRow: { flex: 1, flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
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
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  region: { fontSize: fontSize.base, color: colors.textSecondary, marginTop: 2 },
  description: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 22,
    marginTop: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary, width: 76 },
  infoValue: { fontSize: fontSize.sm, color: colors.textPrimary, flex: 1, fontWeight: '600' },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  weatherStat: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  weatherLabel: { fontSize: fontSize.xs, lineHeight: 16, color: colors.textSecondary },
  weatherValue: {
    fontSize: fontSize.base,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  windTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  windTipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    fontWeight: '600',
  },
});
