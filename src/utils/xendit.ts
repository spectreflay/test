import axios from 'axios';

const XENDIT_API_URL = 'https://api.xendit.co';
const XENDIT_SECRET_KEY = import.meta.env.VITE_XENDIT_SECRET_KEY;
const IS_DEVELOPMENT = import.meta.env.MODE === 'development';

const xenditAxios = axios.create({
  baseURL: XENDIT_API_URL,
  headers: {
    Authorization: `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`,
    'Content-Type': 'application/json',
  },
});

export const createInvoice = async (amount: number, description: string) => {
  try {
    const response = await xenditAxios.post('/v2/invoices', {
      external_id: `inv-${Date.now()}`,
      amount,
      description,
      currency: 'PHP',
      payment_methods: ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'],
      success_redirect_url: `${window.location.origin}/subscription?status=success&payment_id={id}`,
      failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const createCardToken = async (cardData: any) => {
  try {
    const response = await xenditAxios.post('/v2/credit_card_tokens', {
      card_number: cardData.card_number,
      card_exp_month: cardData.exp_month,
      card_exp_year: cardData.exp_year,
      card_cvn: cardData.cvc,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating card token:', error);
    throw error;
  }
};

export const createCardCharge = async (tokenId: string, amount: number, description: string) => {
  try {
    const response = await xenditAxios.post('/credit_card_charges', {
      token_id: tokenId,
      external_id: `charge-${Date.now()}`,
      amount,
      currency: 'PHP',
      description,
    });
    return response.data;
  } catch (error) {
    console.error('Error charging card:', error);
    throw error;
  }
};

export const getInvoiceStatus = async (invoiceId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invoice status:', error);
    throw error;
  }
};

export const createEWalletCharge = async (type: 'GCASH' | 'GRABPAY' | 'PAYMAYA', amount: number, description: string) => {
  try {
    const response = await xenditAxios.post('/ewallets/charges', {
      reference_id: `ewallet-${Date.now()}`,
      currency: 'PHP',
      amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: type,
      channel_properties: {
        success_redirect_url: `${window.location.origin}/subscription?status=success`,
        failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating e-wallet charge:', error);
    throw error;
  }
};