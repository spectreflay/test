import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  theme: 'light' | 'dark' | 'green' | 'indigo';
  setTheme: (theme: 'light' | 'dark' | 'green' | 'indigo') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: (typeof window !== 'undefined' && localStorage.getItem('theme-storage')) 
        ? JSON.parse(localStorage.getItem('theme-storage') || '{}').state?.theme || 'light'
        : 'light',
      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

