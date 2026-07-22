import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import type { Spot } from '../types/spot';
import { getThemeMeta } from '../constants/themes';
import { colors } from '../constants/colors';

interface Props {
  spot: Spot;
  onTap: () => void;
}

export function SpotMarker({ spot, onTap }: Props) {
  const theme = getThemeMeta(spot.themes[0]);

  return (
    <NaverMapMarkerOverlay
      latitude={spot.lat}
      longitude={spot.lng}
      width={36}
      height={36}
      anchor={{ x: 0.5, y: 0.5 }}
      onTap={onTap}
      caption={{ text: spot.name, textSize: 11, color: colors.textPrimary }}
    >
      <View style={[styles.pin, { borderColor: theme.color }]}>
        <Ionicons name={theme.icon} size={16} color={theme.color} />
      </View>
    </NaverMapMarkerOverlay>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.black,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
