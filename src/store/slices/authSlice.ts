import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api";
import { Staff } from "../services/staffService";
import { useThemeStore } from "../ui/themeStore";

interface User {
  _id: string;
  name: string;
  email: string;
  themePreference?: "light" | "dark" | "green" | "indigo";
  isEmailVerified: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  staff: Staff | null;
}

const loadState = (): AuthState => {
  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const staff = localStorage.getItem("staff");

    // If user exists but is not verified, only clear storage after registration flow is complete
    if (user) {
      const userData = JSON.parse(user);
      const isRegistrationFlow = sessionStorage.getItem("registrationFlow");
      if (!userData.isEmailVerified && !isRegistrationFlow) {
        localStorage.clear();
        return {
          token: null,
          user: null,
          staff: null,
        };
      }
    }

    // If staff exists, load their theme preference
    if (staff) {
      const staffData = JSON.parse(staff);
      if (staffData.themePreference) {
        const setTheme = useThemeStore.getState().setTheme;
        setTheme(staffData.themePreference);
      }
    }

    return {
      token: token || null,
      user: user ? JSON.parse(user) : null,
      staff: staff ? JSON.parse(staff) : null,
    };
  } catch (err) {
    return {
      token: null,
      user: null,
      staff: null,
    };
  }
};

const initialState: AuthState = loadState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        _id: string;
        name: string;
        email: string;
        themePreference?: "light" | "dark" | "green" | "indigo";
        isEmailVerified: boolean;
      }>
    ) => {
      const { token, ...user } = action.payload;

      // Clear any existing store data
      localStorage.removeItem("selectedStoreId");

      // Set token and user regardless of verification status during registration
      state.token = token;
      state.user = user;
      state.staff = null;

      // Store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Mark as registration flow
      if (!user.isEmailVerified) {
        sessionStorage.setItem("registrationFlow", "true");
      }

      // Set theme preference
      if (user.themePreference) {
        const setTheme = useThemeStore.getState().setTheme;
        setTheme(user.themePreference);
      }
    },
    setStaffCredentials: (
      state,
      action: PayloadAction<Staff & { token: string }>
    ) => {
      localStorage.clear();
      sessionStorage.removeItem("registrationFlow");
      const { token, ...staff } = action.payload;
      state.token = token;
      state.staff = staff;
      state.user = null;
      localStorage.setItem("token", token);
      localStorage.setItem("staff", JSON.stringify(staff));

      // Set theme preference for staff
      if (staff.themePreference) {
        const setTheme = useThemeStore.getState().setTheme;
        setTheme(staff.themePreference);
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.staff = null;

      // Clear all localStorage
      localStorage.clear();
      sessionStorage.removeItem("registrationFlow");

      // Reset theme to default on logout
      const setTheme = useThemeStore.getState().setTheme;
      setTheme("light");

      // Reset all RTK Query cache
      api.util.resetApiState();
    },
  },
});

export const { setCredentials, setStaffCredentials, logout } =
  authSlice.actions;
export default authSlice.reducer;
