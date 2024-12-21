import React, { useEffect } from 'react';
import { useThemeStore } from '../store/ui/themeStore';
import { useGetUserThemeQuery } from '../store/services/userService';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, setTheme } = useThemeStore();
  const { token } = useSelector((state: RootState) => state.auth);
  const { data: userTheme, isSuccess } = useGetUserThemeQuery(undefined, {
    skip: !token,
  });

  // Set theme from user preferences only when logged in
  useEffect(() => {
    if (token && isSuccess && userTheme) {
      setTheme(userTheme.themePreference as 'light' | 'dark' | 'green' | 'indigo');
    } else if (!token) {
      setTheme('light');
    }
  }, [token, isSuccess, userTheme, setTheme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
};