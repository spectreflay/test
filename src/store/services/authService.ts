import { api } from "../api";
import {
  createNotification,
  getWelcomeMessage,
} from "../../utils/notification";
import { subscriptionApi } from "./subscriptionService";
import { setCredentials } from "../slices/authSlice";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  themePreference?: "light" | "dark" | "green" | "indigo";
  isEmailVerified: boolean;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginRequest>({
      query: (credentials) => ({
        url: "auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any) => {
        return {
          ...response,
          isEmailVerified: response.isEmailVerified ?? false,
        };
      },
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: "auth/register",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;

          // First set the credentials to ensure we have the token
          dispatch(setCredentials(user));

          // Create welcome notification
          await createNotification(dispatch, getWelcomeMessage(user.name));

          // Get free tier subscription
          const { data: subscriptions } = await dispatch(
            subscriptionApi.endpoints.getSubscriptions.initiate(undefined, {
              forceRefetch: true,
            })
          );

          const freeTier = subscriptions?.find((sub) => sub.name === "free");

          if (freeTier) {
            // Subscribe user to free tier regardless of email verification status
            await dispatch(
              subscriptionApi.endpoints.subscribe.initiate({
                subscriptionId: freeTier._id,
                paymentMethod: "free",
                billingCycle: "monthly", // Add default billing cycle
                paymentDetails: {
                  status: "completed",
                },
              })
            ).unwrap();

            // Force refetch current subscription
            await dispatch(
              subscriptionApi.endpoints.getCurrentSubscription.initiate(
                undefined,
                {
                  forceRefetch: true,
                  subscribe: false,
                }
              )
            );
          }
        } catch (error) {
          console.error("Error in register:", error);
        }
      },
    }),
    getProfile: builder.query<Omit<User, "token">, void>({
      query: () => "auth/profile",
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetProfileQuery } =
  authApi;