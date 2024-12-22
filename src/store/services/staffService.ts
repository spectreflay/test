import { api } from "../api";
import { Role } from "./roleService";
import {
  createNotification,
  getStaffLoginMessage,
} from "../../utils/notification";

export interface Staff {
  _id: string;
  name: string;
  email: string;
  role: Role;
  store: string;
  status: "active" | "inactive";
  themePreference: "light" | "dark" | "green" | "indigo";
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  store: string;
}

export interface StaffLoginRequest {
  email: string;
  password: string;
}

export interface UpdateStaffPasswordRequest {
  _id: string;
  currentPassword: string;
  newPassword: string;
}

export interface UpdateStaffProfileRequest {
  _id: string;
  name: string;
  email: string;
}

export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStaff: builder.query<Staff[], string>({
      query: (storeId) => `staff/${storeId}`,
      providesTags: ["Staff"],
    }),
    createStaff: builder.mutation<Staff, CreateStaffRequest>({
      query: (staffData) => ({
        url: "staff",
        method: "POST",
        body: staffData,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation<Staff, Partial<Staff> & Pick<Staff, "_id">>({
      query: ({ _id, ...patch }) => ({
        url: `staff/${_id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaffProfile: builder.mutation<Staff, UpdateStaffProfileRequest>({
      query: ({ _id, ...data }) => ({
        url: `staff/${_id}/profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaffPassword: builder.mutation<void, UpdateStaffPasswordRequest>({
      query: ({ _id, ...data }) => ({
        url: `staff/${_id}/password`,
        method: "PUT",
        body: data,
      }),
    }),
    updateStaffTheme: builder.mutation<
      void,
      { _id: string; themePreference: "light" | "dark" | "green" | "indigo" }
    >({
      query: ({ _id, themePreference }) => ({
        url: `staff/${_id}/theme`,
        method: "PUT",
        body: { themePreference },
      }),
    }),
    getStaffTheme: builder.query<{ themePreference: string }, string>({
      query: (id) => `staff/${id}/theme`,
    }),
    deleteStaff: builder.mutation<void, string>({
      query: (id) => ({
        url: `staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),
    staffLogin: builder.mutation<Staff & { token: string }, StaffLoginRequest>({
      query: (credentials) => ({
        url: "staff/login",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});

export const {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateStaffProfileMutation,
  useUpdateStaffPasswordMutation,
  useUpdateStaffThemeMutation,
  useGetStaffThemeQuery,
  useDeleteStaffMutation,
  useStaffLoginMutation,
} = staffApi;
