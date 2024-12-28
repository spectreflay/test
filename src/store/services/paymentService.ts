import { api } from "../api";
import { createInvoice, createCardToken, createCardCharge, getInvoiceStatus, createEWalletCharge } from '../../utils/xendit';

interface CardDetails {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
}

export const createPaymentIntent = async (amount: number, subscriptionId: string) => {
  try {
    const invoice = await createInvoice(amount, `Subscription Payment - ${subscriptionId}`);
    return invoice;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

export const verifyPayment = async (paymentId: string) => {
  try {
    const status = await getInvoiceStatus(paymentId);
    return status.status;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Failed to verify payment');
  }
};

export const createPayment = async (amount: number, subscriptionId: string, cardDetails: CardDetails) => {
  try {
    // Create card token
    const token = await createCardToken({
      card_number: cardDetails.number,
      exp_month: parseInt(cardDetails.exp_month),
      exp_year: parseInt(cardDetails.exp_year),
      cvc: cardDetails.cvc,
    });

    // Create charge using the token
    const charge = await createCardCharge(
      token.id,
      amount,
      `Subscription Payment - ${subscriptionId}`
    );

    return charge.status;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new Error('Failed to process payment');
  }
};

export const createEWalletPayment = async (type: 'GCASH' | 'GRABPAY' | 'PAYMAYA', amount: number, subscriptionId: string) => {
  try {
    const charge = await createEWalletCharge(
      type,
      amount,
      `Subscription Payment - ${subscriptionId}`
    );
    return charge;
  } catch (error) {
    console.error('Error creating e-wallet payment:', error);
    throw new Error('Failed to create e-wallet payment');
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
    verifyPayment: builder.mutation<{ status: string }, { paymentId: string }>({
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