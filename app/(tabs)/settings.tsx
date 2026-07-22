import { useState } from 'react';
import { View, Text, Switch, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEMES } from '../../constants/themes';
import { usePreferenceStore } from '../../store/preferenceStore';
import { requestGeofencePermissions, syncGeofences } from '../../lib/geofencing';
import { getApprovedSpots } from '../../data/mockSpots';
import { colors } from '../../constants/colors';
import { spacing, fontSize, radius as radiusToken } from '../../constants/typography';

const RADIUS_STEPS = [300, 500, 1000, 2000];

export default function SettingsScreen() {
  const {
    subscribedThemes,
    toggleTheme,
    geofenceRadiusMeters,
    setGeofenceRadius,
    notificationEnabled,
    setNotificationEnabled,
  } = usePreferenceStore();
  const [syncing, setSyncing] = useState(false);

  const subscribedSpotIds = getApprovedSpots()
    .filter((s) => s.themes.some((t) => subscribedThemes.includes(t)))
    .map((s) => s.id);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestGeofencePermissions();
      if (!granted) {
        Alert.alert('권한 필요', '위치 및 알림 권한을 허용해야 지오펜싱 알림을 받을 수 있습니다.');
        return;
      }
    }
    setNotificationEnabled(value);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncGeofences(
        notificationEnabled ? subscribedSpotIds : [],
        geofenceRadiusMeters
      );
      Alert.alert('완료', `${subscribedSpotIds.length}개 스팟의 지오펜스가 동기화되었습니다.`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>설정</Text>

        <Section title="관심 테마 구독">
          <View style={styles.themeGrid}>
            {THEMES.map((theme) => {
              const active = subscribedThemes.includes(theme.id);
              return (
                <Pressable
                  key={theme.id}
                  style={[styles.themeItem, active && styles.themeItemActive]}
                  onPress={() => toggleTheme(theme.id)}
                >
                  <Ionicons name={theme.icon} size={18} color={theme.color} />
                  <Text
                    style={[styles.themeItemText, active && styles.themeItemTextActive]}
                  >
                    {theme.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={16} color={colors.white} style={{ marginLeft: 'auto' }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="알림 반경">
          <View style={styles.radiusRow}>
            {RADIUS_STEPS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setGeofenceRadius(m)}
                style={[
                  styles.radiusOption,
                  geofenceRadiusMeters === m && styles.radiusOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    geofenceRadiusMeters === m && styles.radiusOptionTextActive,
                  ]}
                >
                  {m >= 1000 ? `${m / 1000}km` : `${m}m`}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="지오펜싱 알림">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>스팟 진입 알림</Text>
              <Text style={styles.rowSub}>
                구독한 테마의 스팟 반경 진입 시 조건 요약 푸시를 받습니다
              </Text>
            </View>
            <Switch value={notificationEnabled} onValueChange={handleToggleNotifications} />
          </View>

          <Pressable
            style={[styles.syncButton, syncing && { opacity: 0.5 }]}
            onPress={handleSync}
            disabled={syncing}
          >
            <Ionicons name="sync-outline" size={16} color={colors.white} />
            <Text style={styles.syncButtonText}>
              {syncing ? '동기화 중…' : `지오펜스 동기화 (${subscribedSpotIds.length}곳)`}
            </Text>
          </Pressable>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.textPrimary },
  section: { marginTop: spacing.xxl },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeGrid: { gap: spacing.sm },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radiusToken.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  themeItemActive: { backgroundColor: colors.black, borderColor: colors.black },
  themeItemText: { fontSize: fontSize.base, fontWeight: '600', color: colors.textPrimary },
  themeItemTextActive: { color: colors.white },
  radiusRow: { flexDirection: 'row', gap: spacing.sm },
  radiusOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radiusToken.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  radiusOptionActive: { backgroundColor: colors.black, borderColor: colors.black },
  radiusOptionText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  radiusOptionTextActive: { color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: { fontSize: fontSize.base, fontWeight: '700', color: colors.textPrimary },
  rowSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.black,
    paddingVertical: spacing.md,
    borderRadius: radiusToken.md,
    marginTop: spacing.lg,
  },
  syncButtonText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
});
