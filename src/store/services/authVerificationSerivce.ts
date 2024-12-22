import { api } from '../api';

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export const authVerificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Email verification endpoints
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

    // Password reset endpoints
    forgotPassword: builder.mutation<PasswordResetResponse, { email: string }>({
      query: (data) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<
      PasswordResetResponse,
      { token: string; newPassword: string }
    >({
      query: (data) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  // Email verification hooks
  useSendVerificationEmailMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  // Password reset hooks
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authVerificationApi;