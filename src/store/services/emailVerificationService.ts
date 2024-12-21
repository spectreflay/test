import { api } from '../api';

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export const emailVerificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendVerificationEmail: builder.mutation<EmailVerificationResponse, void>({
      query: () => ({
        url: 'auth/send-verification',
        method: 'POST',
      }),
    }),
    verifyEmail: builder.mutation<EmailVerificationResponse, { token: string }>({
      query: (data) => ({
        url: 'auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),
    resendVerification: builder.mutation<EmailVerificationResponse, { email: string }>({
      query: (data) => ({
        url: 'auth/resend-verification',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useSendVerificationEmailMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = emailVerificationApi;