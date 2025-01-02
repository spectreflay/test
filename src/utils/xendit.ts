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

interface XenditCustomer {
  reference_id: string;
  type: 'INDIVIDUAL';
  email: string;
  given_names: string;
  mobile_number?: string;
  addresses?: Array<{
    country: string;
    street_line1: string;
    city: string;
  }>;
}

interface XenditPlan {
  reference_id: string;
  currency: string;
  amount: number;
  interval: 'MONTH' | 'YEAR';
  name: string;
  description?: string;
}

interface XenditSubscription {
  plan_id: string;
  customer_id: string;
  success_redirect_url: string;
  failure_redirect_url: string;
}

export const createCustomer = async (customerData: {
  email: string;
  name: string;
  phone?: string;
}): Promise<any> => {
  try {
    const customer: XenditCustomer = {
      reference_id: `cust_${Date.now()}`,
      type: 'INDIVIDUAL',
      email: customerData.email,
      given_names: customerData.name,
      mobile_number: customerData.phone,
    };

    const response = await xenditAxios.post('/customers', customer);
    return response.data;
  } catch (error) {
    console.error('Error creating Xendit customer:', error);
    throw error;
  }
};

export const createSubscriptionPlan = async (planData: {
  name: string;
  amount: number;
  interval: 'MONTH' | 'YEAR';
  description?: string;
}): Promise<any> => {
  try {
    const plan: XenditPlan = {
      reference_id: `plan_${Date.now()}`,
      currency: 'PHP',
      amount: Math.round(planData.amount * 100), // Convert to cents
      interval: planData.interval,
      name: planData.name,
      description: planData.description,
    };

    const response = await xenditAxios.post('/recurring/plans', plan);
    return response.data;
  } catch (error) {
    console.error('Error creating Xendit subscription plan:', error);
    throw error;
  }
};

export const createSubscription = async (subscriptionData: {
  planId: string;
  customerId: string;
}): Promise<any> => {
  try {
    const subscription: XenditSubscription = {
      plan_id: subscriptionData.planId,
      customer_id: subscriptionData.customerId,
      success_redirect_url: `${window.location.origin}/subscription?status=success`,
      failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
    };

    const response = await xenditAxios.post('/recurring/subscriptions', subscription);
    return response.data;
  } catch (error) {
    console.error('Error creating Xendit subscription:', error);
    throw error;
  }
};

export const getSubscriptionStatus = async (subscriptionId: string): Promise<any> => {
  try {
    const response = await xenditAxios.get(`/recurring/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId: string): Promise<any> => {
  try {
    const response = await xenditAxios.post(`/recurring/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};