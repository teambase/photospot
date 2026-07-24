import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeId } from '../constants/colors';

interface PreferenceState {
  subscribedThemes: ThemeId[];
  geofenceRadiusMeters: number;
  notificationEnabled: boolean;
  toggleTheme: (id: ThemeId) => void;
  setGeofenceRadius: (meters: number) => void;
  setNotificationEnabled: (enabled: boolean) => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      subscribedThemes: ['sunset', 'cherry', 'stars'],
      geofenceRadiusMeters: 500,
      // 위치/알림 권한을 아직 요청한 적 없는 상태이므로 false로 시작한다.
      // true로 시작하면 실제 권한 승인 없이도 토글이 켜진 것처럼 보여, syncGeofences 호출 시
      // DeniedBackgroundLocationPermission 에러로 이어질 수 있다.
      notificationEnabled: false,
      toggleTheme: (id) =>
        set((state) => ({
          subscribedThemes: state.subscribedThemes.includes(id)
            ? state.subscribedThemes.filter((t) => t !== id)
            : [...state.subscribedThemes, id],
        })),
      setGeofenceRadius: (meters) => set({ geofenceRadiusMeters: meters }),
      setNotificationEnabled: (enabled) => set({ notificationEnabled: enabled }),
    }),
    {
      name: 'photospot-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
