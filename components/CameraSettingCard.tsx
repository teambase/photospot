import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CameraSetting } from '../types/spot';
import { colors } from '../constants/colors';
import { radius, spacing, fontSize } from '../constants/typography';

export function CameraSettingCard({ setting }: { setting: CameraSetting }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="camera-outline" size={16} color={colors.textPrimary} />
        <Text style={styles.condition}>{setting.condition}</Text>
      </View>

      <View style={styles.grid}>
        <Stat label="조리개" value={setting.aperture} />
        <Stat label="셔터스피드" value={setting.shutterSpeed} />
        <Stat label="ISO" value={setting.iso} />
      </View>

      <Text style={styles.note}>{setting.note}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.black,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  condition: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  grid: { flexDirection: 'row', gap: spacing.lg },
  stat: { flex: 1 },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  statValue: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  note: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
