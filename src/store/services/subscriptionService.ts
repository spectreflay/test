import { api } from "../api";

export interface Subscription {
  _id: string;
  name: "free" | "basic" | "premium";
  features: string[];
  maxProducts: number;
  maxStaff: number;
  maxStores: number;
  monthlyPrice: number;
  yearlyPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  _id: string;
  user: string;
  subscription: Subscription;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  billingCycle: "monthly" | "yearly";
  paymentMethod: string;
  paymentDetails?: {
    paymentId?: string;
    amount?: number;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistory {
  _id: string;
  user: string;
  subscription: Subscription;
  action: 'subscribed' | 'cancelled' | 'billing_cycle_changed';
  reason?: string;
  billingCycle: 'monthly' | 'yearly';
  createdAt: string;
  amount: number;
  paymentMethod?: string;
  status?: string;
}

export interface SubscribeRequest {
  subscriptionId: string;
  paymentMethod: string;
  billingCycle: "monthly" | "yearly";
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
    getSubscriptionHistory: builder.query<SubscriptionHistory[], void>({
      query: () => "subscriptions/history",
      providesTags: ["SubscriptionHistory"],
      transformResponse: (response: SubscriptionHistory[]) => {
        // Sort by date (newest first)
        return [...response].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
    }),
    subscribe: builder.mutation<UserSubscription, SubscribeRequest>({
      query: (data) => ({
        url: "subscriptions/subscribe",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CurrentSubscription", "SubscriptionHistory"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: subscription } = await queryFulfilled;

          // Force refetch current subscription and history after successful subscription
          await Promise.all([
            dispatch(
              subscriptionApi.endpoints.getCurrentSubscription.initiate(
                undefined,
                {
                  forceRefetch: true,
                  subscribe: false,
                }
              )
            ),
            dispatch(
              subscriptionApi.endpoints.getSubscriptionHistory.initiate(
                undefined,
                {
                  forceRefetch: true,
                  subscribe: false,
                }
              )
            ),
          ]);

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
      invalidatesTags: ["CurrentSubscription", "SubscriptionHistory"],
    }),
    cancelSubscription: builder.mutation<void, void>({
      query: () => ({
        url: "subscriptions/cancel",
        method: "POST",
      }),
      invalidatesTags: ["CurrentSubscription", "SubscriptionHistory"],
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
  useGetSubscriptionHistoryQuery,
  useSubscribeMutation,
  useVerifySubscriptionMutation,
  useCancelSubscriptionMutation,
  useChangeBillingCycleMutation,
} = subscriptionApi;