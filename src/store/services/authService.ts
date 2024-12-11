import { api } from '../api';
import { createNotification, getWelcomeMessage } from '../../utils/notification';
import { subscriptionApi } from './subscriptionService';

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
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<User, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: 'auth/register',
        method: 'POST',
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          
          // Get free tier subscription
          const { data: subscriptions } = await dispatch(
            subscriptionApi.endpoints.getSubscriptions.initiate()
          );
          
          const freeTier = subscriptions?.find(sub => sub.name === 'free');
          
          if (freeTier) {
            // Subscribe user to free tier
            await dispatch(
              subscriptionApi.endpoints.subscribe.initiate({
                subscriptionId: freeTier._id,
                paymentMethod: 'free'
              })
            );
          }

          // Create welcome notification
          await createNotification(
            dispatch,
            getWelcomeMessage(user.name)
          );
        } catch (error) {
          console.error('Error in register:', error);
        }
      }
    }),
    getProfile: builder.query<Omit<User, 'token'>, void>({
      query: () => 'auth/profile',
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
} = authApi;