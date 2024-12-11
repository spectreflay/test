import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api";
import { Staff } from "../services/staffService";
import { useThemeStore } from "../ui/themeStore";

interface User {
  _id: string;
  name: string;
  email: string;
  themePreference?: "light" | "dark" | "green" | "indigo";
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
      }>
    ) => {
      localStorage.clear();
      const { token, ...user } = action.payload;
      state.token = token;
      state.user = user;
      state.staff = null;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Set theme preference
      if (action.payload.themePreference) {
        const setTheme = useThemeStore.getState().setTheme;
        setTheme(action.payload.themePreference);
      }
    },
    setStaffCredentials: (
      state,
      action: PayloadAction<Staff & { token: string }>
    ) => {
      localStorage.clear();
      const { token, ...staff } = action.payload;
      state.token = token;
      state.staff = staff;
      state.user = null;
      localStorage.setItem("token", token);
      localStorage.setItem("staff", JSON.stringify(staff));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.staff = null;
      localStorage.clear();

      // Reset all RTK Query cache
      api.util.resetApiState();
    },
  },
});

export const { setCredentials, setStaffCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

