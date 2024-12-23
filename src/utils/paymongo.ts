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

// Create a customer for recurring payments
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
    const response = await paymongoAxios.post(
      '/payment_methods',
      { data: { attributes: paymentMethodData } },
    );
    return response.data.data;
  } catch (error) {
    return handlePaymongoError(error);
  }
};

export const attachPaymentMethod = async (paymentMethodId: string) => {
  try {
    const response = await paymongoAxios.post(
      `/payment_methods/${paymentMethodId}/attach`,
      {},
    );
    return response.data.data;
  } catch (error) {
    return handlePaymongoError(error);
  }
};

export const createPaymentIntent = async ({ 
  amount, 
  paymentMethodAllowed, 
  paymentMethodId, 
  description, 
  currency = 'PHP',
  customerId,
  setupFutureUsage = true
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
          // Add payment method directly in the initial creation if provided
          ...(paymentMethodId && { payment_method: paymentMethodId }),
        },
      },
    };

    if (setupFutureUsage && customerId) {
      paymentIntentData.data.attributes.setup_future_usage = 'off_session';
      paymentIntentData.data.attributes.customer = customerId;
    }

    const response = await paymongoAxios.post('/payment_intents', paymentIntentData);
    const paymentIntent = response.data.data;

    // No need to attach separately as it's included in the initial creation
    return paymentIntent;
  } catch (error) {
    if (error.response?.data?.errors?.[0]?.code === 'parameter_attached_state') {
      // If payment method is already attached, try to create a new payment intent without attachment
      const retryResponse = await paymongoAxios.post('/payment_intents', {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            payment_method_allowed: paymentMethodAllowed,
            currency,
            description,
            statement_descriptor: 'POS System Subscription',
            setup_future_usage: setupFutureUsage ? 'off_session' : undefined,
            customer: customerId,
          },
        },
      });
      return retryResponse.data.data;
    }
    return handlePaymongoError(error);
  }
};

export const attachPaymentMethodToIntent = async (paymentIntentId: string, paymentMethodId: string) => {
  try {
    const response = await paymongoAxios.post(`/payment_intents/${paymentIntentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          client_key: PAYMONGO_PUBLIC_KEY,
          return_url: `${window.location.origin}/subscription/success`
        },
      },
    });
    return response.data.data;
  } catch (error) {
    return handlePaymongoError(error);
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

export const confirmPaymentIntent = async (paymentIntentId: string, paymentMethodId: string) => {
  try {
    const response = await paymongoAxios.post(`/payment_intents/${paymentIntentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethodId,
        },
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error confirming payment intent:', error.response?.data || error);
    throw error;
  }
};