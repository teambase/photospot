import { View, Text, StyleSheet } from 'react-native';
import type { ScoreResult } from '../lib/recommendation';
import { colors } from '../constants/colors';
import { radius, spacing, fontSize } from '../constants/typography';

const LABEL_DOT: Record<ScoreResult['label'], string> = {
  '매우 좋음': '#111111',
  좋음: '#4A4A4A',
  보통: '#9C9C9C',
  아쉬움: '#C7C7C7',
};

export function ScoreBadge({ score, label }: ScoreResult) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: LABEL_DOT[label] }]} />
      <Text style={styles.text}>
        {label} · {score}점
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
