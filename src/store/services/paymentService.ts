import axios from 'axios';
import { api } from "../api";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || "sk_test_qprGQz76AaFHqQbvhMm5wvCq";
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

interface CardDetails {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
}

const paymongoAxios = axios.create({
  baseURL: PAYMONGO_API_URL,
  headers: {
    Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY as string).toString('base64')}`,
    'Content-Type': 'application/json',
  },
});

export const createPaymentIntent = async (amount: number, subscriptionId: string) => {
  try {
    const response = await paymongoAxios.post('/sources', {
      data: {
        attributes: {
          amount: amount * 100, // Paymongo expects amount in cents
          redirect: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
            failed: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/failed`,
          },
          type: 'gcash',
          currency: 'PHP',
        },
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

export const verifyPayment = async (paymentIntentId: string) => {
  try {
    const response = await paymongoAxios.get(`/sources/${paymentIntentId}`);
    return response.data.data.attributes.status;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Failed to verify payment');
  }
};

export const createPayment = async (amount: number, subscriptionId: string, cardDetails: CardDetails) => {
  try {
    // Step 1: Create a PaymentMethod
    const paymentMethodResponse = await paymongoAxios.post('/payment_methods', {
      data: {
        attributes: {
          details: {
            card_number: cardDetails.number,
            exp_month: parseInt(cardDetails.exp_month),
            exp_year: parseInt(cardDetails.exp_year),
            cvc: cardDetails.cvc,
          },
          type: 'card',
        },
      },
    });

    const paymentMethodId = paymentMethodResponse.data.data.id;

    // Step 2: Create a Payment Intent
    const paymentIntentResponse = await paymongoAxios.post('/payment_intents', {
      data: {
        attributes: {
          amount: amount * 100, // Paymongo expects amount in cents
          payment_method_allowed: ['card'],
          payment_method_options: { card: { request_three_d_secure: 'any' } },
          currency: 'PHP',
          capture_type: 'automatic',
        },
      },
    });

    const paymentIntentId = paymentIntentResponse.data.data.id;

    // Step 3: Attach PaymentMethod to PaymentIntent
    const attachResponse = await paymongoAxios.post(`/payment_intents/${paymentIntentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          client_key: process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY,
        },
      },
    });

    return attachResponse.data.data.attributes.status;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new Error('Failed to process payment');
  }
};

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<any, { amount: number; subscriptionId: string }>({
      query: (data) => ({
        url: "payments/create-payment-intent",
        method: "POST",
        body: data,
      }),
    }),
    verifyPayment: builder.mutation<{ status: string }, { paymentIntentId: string }>({
      query: (data) => ({
        url: "payments/verify-payment",
        method: "POST",
        body: data,
      }),
    }),
    createPayment: builder.mutation<{ status: string }, { amount: number; subscriptionId: string; cardDetails: CardDetails }>({
      query: (data) => ({
        url: "payments/create-payment",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
  useCreatePaymentMutation,
} = paymentApi;