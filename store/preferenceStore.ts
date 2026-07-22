import { create } from 'zustand';
import type { ThemeId } from '../constants/colors';

interface PreferenceState {
  subscribedThemes: ThemeId[];
  geofenceRadiusMeters: number;
  notificationEnabled: boolean;
  toggleTheme: (id: ThemeId) => void;
  setGeofenceRadius: (meters: number) => void;
  setNotificationEnabled: (enabled: boolean) => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  subscribedThemes: ['sunset', 'cherry', 'stars'],
  geofenceRadiusMeters: 500,
  notificationEnabled: true,
  toggleTheme: (id) =>
    set((state) => ({
      subscribedThemes: state.subscribedThemes.includes(id)
        ? state.subscribedThemes.filter((t) => t !== id)
        : [...state.subscribedThemes, id],
    })),
  setGeofenceRadius: (meters) => set({ geofenceRadiusMeters: meters }),
  setNotificationEnabled: (enabled) => set({ notificationEnabled: enabled }),
}));
