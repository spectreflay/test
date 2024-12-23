import axios from 'axios';

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
const IS_DEVELOPMENT = import.meta.env.MODE === 'development';

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

export const createPaymentMethod = async ({ type, details, billing }: any) => {
  try {
    const response = await paymongoAxios.post('/payment_methods', {
      data: {
        attributes: {
          type,
          details,
          billing
        },
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating payment method:', error);
    throw error;
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
    // Create payment intent with setup for future usage
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

    // Add setup_future_usage if needed
    if (setupFutureUsage && customerId) {
      paymentIntentData.data.attributes.setup_future_usage = {
        customer_id: customerId,
        session_type: 'offline',
      };
    }

    const response = await paymongoAxios.post('/payment_intents', paymentIntentData);
    const paymentIntent = response.data.data;

    // Attach payment method if provided
    if (paymentMethodId) {
      await paymongoAxios.post(`/payment_intents/${paymentIntent.id}/attach`, {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: PAYMONGO_PUBLIC_KEY,
            return_url: `${window.location.origin}/subscription/success`
          },
        },
      });
    }

    return paymentIntent;
  } catch (error) {
    console.error('Error creating/attaching payment intent:', error);
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