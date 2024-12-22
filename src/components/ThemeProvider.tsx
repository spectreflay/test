import React, { useEffect } from 'react';
import { useThemeStore } from '../store/ui/themeStore';
import { useGetUserThemeQuery } from '../store/services/userService';
import { useGetStaffThemeQuery } from '../store/services/staffService';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, setTheme } = useThemeStore();
  const { token, staff, user } = useSelector((state: RootState) => state.auth);
  
  // Only fetch user theme if we have a regular user
  const { data: userTheme, isSuccess: userThemeSuccess } = useGetUserThemeQuery(undefined, {
    skip: !token || !!staff,
  });

  // Only fetch staff theme if we have a staff user
  const { data: staffTheme, isSuccess: staffThemeSuccess } = useGetStaffThemeQuery(staff?._id || '', {
    skip: !token || !staff,
  });

  // Set theme from user preferences when logged in
  useEffect(() => {
    if (!token) {
      setTheme('light');
    } else if (staff && staffThemeSuccess && staffTheme) {
      setTheme(staffTheme.themePreference as 'light' | 'dark' | 'green' | 'indigo');
    } else if (user && userThemeSuccess && userTheme) {
      setTheme(userTheme.themePreference as 'light' | 'dark' | 'green' | 'indigo');
    }
  }, [token, staff, user, staffTheme, userTheme, staffThemeSuccess, userThemeSuccess, setTheme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
};