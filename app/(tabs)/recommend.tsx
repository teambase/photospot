import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApprovedSpots } from '../../lib/spotsQueries';
import { MOCK_WEATHER } from '../../data/mockWeather';
import { THEMES } from '../../constants/themes';
import { ThemeChip } from '../../components/ThemeChip';
import { SpotCard } from '../../components/SpotCard';
import { scoreWeather } from '../../lib/recommendation';
import { distanceKm } from '../../lib/distance';
import { colors } from '../../constants/colors';
import { spacing, fontSize, radius as radiusToken } from '../../constants/typography';
import type { ThemeId } from '../../constants/colors';

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };
const RADIUS_OPTIONS = [
  { label: '5km', value: 5 },
  { label: '10km', value: 10 },
  { label: '20km', value: 20 },
  { label: '50km', value: 50 },
  { label: '전국', value: Infinity },
];

export default function RecommendScreen() {
  const [activeThemes, setActiveThemes] = useState<ThemeId[]>([]);
  const [radiusKm, setRadiusKm] = useState(20);
  const [origin, setOrigin] = useState(SEOUL_CITY_HALL);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    })();
  }, []);

  const toggleTheme = (id: ThemeId) => {
    setActiveThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const { data: approvedSpots = [] } = useApprovedSpots();

  const results = useMemo(() => {
    return approvedSpots.map((spot) => {
      const weather = MOCK_WEATHER[spot.id];
      const dist = distanceKm(origin.lat, origin.lng, spot.lat, spot.lng);
      const score = weather ? scoreWeather(weather) : null;
      return { spot, weather, dist, score };
    })
      .filter((r) => r.dist <= radiusKm)
      .filter(
        (r) =>
          activeThemes.length === 0 ||
          r.spot.themes.some((t) => activeThemes.includes(t))
      )
      .sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0));
  }, [approvedSpots, origin, radiusKm, activeThemes]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>스팟나우 추천</Text>
        <Text style={styles.subtitle}>
          반경 {radiusKm === Infinity ? '전국' : `${radiusKm}km`} · {results.length}곳
        </Text>
      </View>

      <View style={styles.filterSection}>
        <FlatList
          data={RADIUS_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setRadiusKm(item.value)}
              style={[
                styles.radiusChip,
                radiusKm === item.value && styles.radiusChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.radiusChipText,
                  radiusKm === item.value && styles.radiusChipTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
        <FlatList
          data={THEMES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => (
            <ThemeChip
              theme={item}
              selected={activeThemes.includes(item.id)}
              onPress={() => toggleTheme(item.id)}
            />
          )}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.spot.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>조건에 맞는 스팟이 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <SpotCard
            spot={item.spot}
            weather={item.weather}
            distanceKm={item.dist}
            onPress={() => router.push(`/spot/${item.spot.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  headerBlock: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  filterSection: { marginTop: spacing.lg, gap: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  radiusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radiusToken.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  radiusChipSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  radiusChipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  radiusChipTextSelected: { color: colors.white },
  listContent: { padding: spacing.xl, paddingTop: spacing.lg },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl,
  },
});
