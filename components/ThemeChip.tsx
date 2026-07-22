import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeMeta } from '../constants/themes';
import { colors } from '../constants/colors';
import { radius, spacing, fontSize } from '../constants/typography';

interface Props {
  theme: ThemeMeta;
  selected: boolean;
  onPress: () => void;
}

export function ThemeChip({ theme, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipDefault]}
    >
      <Ionicons name={theme.icon} size={15} color={theme.color} />
      <Text style={[styles.label, { color: selected ? colors.white : colors.textPrimary }]}>
        {theme.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipDefault: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
