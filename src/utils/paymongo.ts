import axios from 'axios';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
const IS_DEVELOPMENT = import.meta.env.MODE === 'development';

const handlePaymongoError = (error: any) => {
  if (error.response?.data?.errors) {
    const paymongoError = error.response.data.errors[0];
    console.error('Paymongo API Error:', {
      code: paymongoError.code,
      detail: paymongoError.detail
    });
    throw new Error(paymongoError.detail);
  }
  throw error;
};

const paymongoAxios = axios.create({
  baseURL: PAYMONGO_API_URL,
  headers: {
    Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`,
    'Content-Type': 'application/json',
  },
});

export const createSource = async (amount: number, type: 'gcash' | 'grab_pay' | 'paymaya') => {
  try {
    const sourceType = type === 'paymaya' ? 'paymaya' : type;
    
    const response = await paymongoAxios.post('/sources', {
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: 'PHP',
          type: sourceType,
          redirect: {
            success: `${window.location.origin}/subscription?status=success&payment_id={id}`,
            failed: `${window.location.origin}/subscription?status=failed`,
          },
          billing: {
            name: IS_DEVELOPMENT ? 'Test User' : undefined,
            email: IS_DEVELOPMENT ? 'test@example.com' : undefined,
            phone: IS_DEVELOPMENT ? '09123456789' : undefined,
          },
          description: IS_DEVELOPMENT 
            ? 'Test payment - Choose "Authorize Test Payment" to simulate success'
            : 'Subscription Payment',
        },
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating source:', error);
    throw error;
  }
};

export const getSourceStatus = async (sourceId: string) => {
  try {
    const response = await paymongoAxios.get(`/sources/${sourceId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error checking source status:', error);
    throw error;
  }
};

export const createCustomer = async (email: string, name: string) => {
  try {
    const response = await paymongoAxios.post('/customers', {
      data: {
        attributes: {
          email,
          name,
        },
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const createPaymentMethod = async (paymentMethodData: any) => {
  try {
    const flatMetadata = Object.entries(paymentMethodData.billing || {}).reduce((acc, [key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const requestBody: any = { 
      data: { 
        attributes: {
          ...paymentMethodData,
          billing: undefined,
        } 
      } 
    };

    if (Object.keys(flatMetadata).length > 0) {
      requestBody.data.attributes.metadata = flatMetadata;
    }

    const response = await paymongoAxios.post('/payment_methods', requestBody);
    return response.data.data;
  } catch (error) {
    return handlePaymongoError(error);
  }
};

export const createPaymentIntent = async ({ 
  amount, 
  paymentMethodAllowed = ['card'],
  description, 
  currency = 'PHP',
  customerId,
  metadata = {}
}: any) => {
  try {
    const paymentIntentData: any = {
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          payment_method_allowed: paymentMethodAllowed,
          payment_method_options: { 
            card: { 
              request_three_d_secure: 'any' 
            } 
          },
          currency,
          description,
          statement_descriptor: 'POS System Subscription',
        },
      },
    };

    if (Object.keys(metadata).length > 0) {
      const flatMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>);

      paymentIntentData.data.attributes.metadata = flatMetadata;
    }

    if (customerId) {
      paymentIntentData.data.attributes.customer = customerId;
    }

    const response = await paymongoAxios.post('/payment_intents', paymentIntentData);
    return response.data.data;
  } catch (error) {
    return handlePaymongoError(error);
  }
};





export const confirmPaymentIntent = async (paymentIntentId: string, paymentMethodId: string) => {
  try {
    const response = await paymongoAxios.post(`/payment_intents/${paymentIntentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          return_url: `${window.location.origin}/subscription/success`,
        },
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error confirming payment intent:', error.response?.data || error);
    throw error;
  }
};

export const getPaymentIntentStatus = async (paymentIntentId: string) => {
  try {
    const response = await paymongoAxios.get(`/payment_intents/${paymentIntentId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error checking payment intent status:', error);
    throw error;
  }
};

