import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NaverMapView, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useApprovedSpots } from '../../lib/spotsQueries';
import { useWeather } from '../../lib/weatherQueries';
import { THEMES } from '../../constants/themes';
import { usePreferenceStore } from '../../store/preferenceStore';
import { ThemeChip } from '../../components/ThemeChip';
import { SpotMarker } from '../../components/SpotMarker';
import { SpotDetailSheet } from '../../components/SpotDetailSheet';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/typography';
import type { Spot } from '../../types/spot';

const SEOUL_CAMERA = { latitude: 36.5, longitude: 127.8, zoom: 6.4 };
// 스케일바가 정확히 "1km"로 표시되는 줌 레벨 (시뮬레이터 실측 확인).
const SCALE_1KM_ZOOM = 12;
const NAVER_MAP_CLIENT_ID = Constants.expoConfig?.extra?.naverMapClientId ?? '';

export default function MapScreen() {
  const { subscribedThemes: activeThemes, toggleTheme } = usePreferenceStore();
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  const mapReadyRef = useRef(false);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const { data: approvedSpots = [] } = useApprovedSpots();
  const { data: selectedSpotWeather } = useWeather(selectedSpot);

  const visibleSpots = useMemo(() => {
    if (activeThemes.length === 0) return approvedSpots;
    return approvedSpots.filter((s) => s.themes.some((t) => activeThemes.includes(t)));
  }, [approvedSpots, activeThemes]);

  const openSpot = useCallback((spot: Spot) => {
    setSelectedSpot(spot);
    sheetRef.current?.present();
  }, []);

  const moveToUserLocation = useCallback(() => {
    const loc = userLocationRef.current;
    if (!loc || !mapReadyRef.current) return;
    mapRef.current?.animateCameraTo({
      latitude: loc.latitude,
      longitude: loc.longitude,
      zoom: SCALE_1KM_ZOOM,
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      userLocationRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      moveToUserLocation();
    })();
  }, [moveToUserLocation]);

  return (
    <View style={styles.flex}>
      <NaverMapView
        ref={mapRef}
        style={styles.flex}
        initialCamera={SEOUL_CAMERA}
        onInitialized={() => {
          mapReadyRef.current = true;
          moveToUserLocation();
        }}
      >
        {visibleSpots.map((spot) => (
          <SpotMarker key={spot.id} spot={spot} onTap={() => openSpot(spot)} />
        ))}
      </NaverMapView>

      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        {!NAVER_MAP_CLIENT_ID && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              NAVER_MAP_CLIENT_ID 미설정 — .env에 발급받은 키를 넣으면 지도가 표시됩니다
            </Text>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {THEMES.map((theme) => (
            <ThemeChip
              key={theme.id}
              theme={theme}
              selected={activeThemes.includes(theme.id)}
              onPress={() => toggleTheme(theme.id)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={['65%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
      >
        {selectedSpot && (
          <SpotDetailSheet spot={selectedSpot} weather={selectedSpotWeather} />
        )}
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  warningBanner: {
    backgroundColor: colors.black,
  },
  warningText: {
    color: colors.white,
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sheetBg: { backgroundColor: colors.white },
  sheetHandle: { backgroundColor: colors.border, width: 40 },
});
