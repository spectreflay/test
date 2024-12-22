import { api } from "../api";

export interface Subscription {
  _id: string;
  name: "free" | "basic" | "premium";
  features: string[];
  maxProducts: number;
  maxStaff: number;
  maxStores: number;
  price: number;
  billingCycle: "monthly" | "yearly";
}

export interface UserSubscription {
  _id: string;
  user: string;
  subscription: Subscription;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  paymentDetails?: {
    paymentId?: string;
    amount?: number;
    status?: string;
  };
}

export interface SubscribeRequest {
  subscriptionId: string;
  paymentMethod: string;
  paymentDetails?: {
    paymentId?: string;
    amount?: number;
    status?: string;
  };
}

export const subscriptionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query<Subscription[], void>({
      query: () => "subscriptions",
      providesTags: ["Subscriptions"],
    }),
    getCurrentSubscription: builder.query<UserSubscription, void>({
      query: () => "subscriptions/current",
      providesTags: ["CurrentSubscription"],
    }),
    subscribe: builder.mutation<UserSubscription, SubscribeRequest>({
      query: (data) => ({
        url: "subscriptions/subscribe",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CurrentSubscription"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: subscription } = await queryFulfilled;

          // Force refetch current subscription after successful subscription
          await dispatch(
            subscriptionApi.endpoints.getCurrentSubscription.initiate(
              undefined,
              {
                forceRefetch: true,
                subscribe: false,
              }
            )
          );

          return subscription;
        } catch (error) {
          console.error("Error updating subscription:", error);
          throw error;
        }
      },
    }),
    verifySubscription: builder.mutation<
      UserSubscription,
      { paymentId: string }
    >({
      query: (data) => ({
        url: "subscriptions/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CurrentSubscription"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: verifiedSubscription } = await queryFulfilled;

          // Force refetch current subscription after verification
          await dispatch(
            subscriptionApi.endpoints.getCurrentSubscription.initiate(
              undefined,
              {
                forceRefetch: true,
                subscribe: false,
              }
            )
          );

          return verifiedSubscription;
        } catch (error) {
          console.error("Error verifying subscription:", error);
          throw error;
        }
      },
    }),
    cancelSubscription: builder.mutation<void, void>({
      query: () => ({
        url: "subscriptions/cancel",
        method: "POST",
      }),
      invalidatesTags: ["CurrentSubscription"],
    }),
    getSubscriptionHistory: builder.query<any[], void>({
      query: () => "subscriptions/history",
      providesTags: ["SubscriptionHistory"],
    }),

    changeBillingCycle: builder.mutation<
      UserSubscription,
      { billingCycle: "monthly" | "yearly" }
    >({
      query: (data) => ({
        url: "subscriptions/change-billing-cycle",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CurrentSubscription", "SubscriptionHistory"],
    }),
  }),
});

export const {
  useGetSubscriptionsQuery,
  useGetCurrentSubscriptionQuery,
  useSubscribeMutation,
  useVerifySubscriptionMutation,
  useCancelSubscriptionMutation,
  useGetSubscriptionHistoryQuery,
} = subscriptionApi;
