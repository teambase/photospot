import { create } from 'zustand';
import type { ThemeId } from '../constants/colors';

interface MapFilterState {
  activeThemes: ThemeId[];
  toggleTheme: (id: ThemeId) => void;
  clearThemes: () => void;
}

export const useMapFilterStore = create<MapFilterState>((set) => ({
  activeThemes: [],
  toggleTheme: (id) =>
    set((state) => ({
      activeThemes: state.activeThemes.includes(id)
        ? state.activeThemes.filter((t) => t !== id)
        : [...state.activeThemes, id],
    })),
  clearThemes: () => set({ activeThemes: [] }),
}));
