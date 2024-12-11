import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../store/ui/themeStore';
import { useGetUserThemeQuery } from '../store/services/userService';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, setTheme } = useThemeStore();
  const { data: userTheme, isSuccess } = useGetUserThemeQuery();
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-storage');
    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      document.documentElement.setAttribute('data-theme', parsedTheme.state.theme);
    }
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (isSuccess && userTheme) {
      setTheme(userTheme.themePreference as 'light' | 'dark' | 'green' | 'indigo');
    }
  }, [isSuccess, userTheme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isThemeReady) {
    return null;
  }

  return <>{children}</>;
};

