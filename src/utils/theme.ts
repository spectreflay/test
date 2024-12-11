import { useThemeStore } from '../store/ui/themeStore';

export const useTheme = () => {
  const { theme, setTheme } = useThemeStore();

  return { theme, setTheme };
};

