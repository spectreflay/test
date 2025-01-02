import { api } from '../api';

export interface XenditCustomerResponse {
  id: string;
  reference_id: string;
  status: string;
}

export interface XenditSubscriptionResponse {
  id: string;
  status: string;
  subscription_id: string;
  plan_id: string;
  customer_id: string;
}

export const xenditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createXenditCustomer: builder.mutation<XenditCustomerResponse, { email: string; name: string; phone?: string }>({
      query: (data) => ({
        url: 'xendit/create-customer',
        method: 'POST',
        body: data,
      }),
    }),

    createXenditSubscription: builder.mutation<
      XenditSubscriptionResponse,
      { planId: string; customerId: string }
    >({
      query: (data) => ({
        url: 'xendit/create-subscription',
        method: 'POST',
        body: data,
      }),
    }),

    verifyXenditSubscription: builder.mutation<
      XenditSubscriptionResponse,
      { subscriptionId: string }
    >({
      query: (data) => ({
        url: 'xendit/verify-subscription',
        method: 'POST',
        body: data,
      }),
    }),

    cancelXenditSubscription: builder.mutation<void, { subscriptionId: string }>({
      query: (data) => ({
        url: 'xendit/cancel-subscription',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useCreateXenditCustomerMutation,
  useCreateXenditSubscriptionMutation,
  useVerifyXenditSubscriptionMutation,
  useCancelXenditSubscriptionMutation,
} = xenditApi;