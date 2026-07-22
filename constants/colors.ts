export const colors = {
  black: '#000000',
  white: '#FFFFFF',
  bg: '#FFFFFF',
  surface: '#F7F7F8',
  surfaceAlt: '#DBDCDF',
  border: 'rgba(112, 115, 124, 0.22)',
  textPrimary: '#171717',
  textSecondary: 'rgba(55, 56, 60, 0.61)',
  textTertiary: 'rgba(55, 56, 60, 0.28)',
  overlay: 'rgba(23, 23, 25, 0.52)',
  primary: '#3366FF',
  positive: '#00BF40',
  negative: '#FF4242',
  caution: '#FF9200',
} as const;

export type ThemeId =
  | 'sunset'
  | 'cherry'
  | 'autumn'
  | 'stars'
  | 'night'
  | 'fog';

export const themeAccent: Record<ThemeId, string> = {
  sunset: '#FF6B35',
  cherry: '#FF7AA2',
  autumn: '#C1440E',
  stars: '#6C5CE7',
  night: '#2F6FED',
  fog: '#7C93A3',
};
