import { api } from "../api";

export interface UpdateProfileRequest {
  name: string;
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateThemeRequest {
  themePreference: "light" | "dark" | "green" | "indigo";
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<any, UpdateProfileRequest>({
      query: (userData) => ({
        url: "users/profile",
        method: "PUT",
        body: userData,
      }),
    }),
    updatePassword: builder.mutation<void, UpdatePasswordRequest>({
      query: (passwordData) => ({
        url: "users/password",
        method: "PUT",
        body: passwordData,
      }),
    }),
    updateTheme: builder.mutation<void, UpdateThemeRequest>({
      query: (themeData) => ({
        url: "users/theme",
        method: "PUT",
        body: themeData,
      }),
    }),
    deleteAccount: builder.mutation<void, void>({
      query: () => ({
        url: "users/account",
        method: "DELETE",
      }),
    }),
    getUserTheme: builder.query<{ themePreference: string }, void>({
      query: () => ({
        url: "users/theme",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useUpdateThemeMutation,
  useDeleteAccountMutation,
  useGetUserThemeQuery,
} = userApi;

