import axios from "axios";

const XENDIT_API_URL = "https://api.xendit.co";
const XENDIT_SECRET_KEY = import.meta.env.VITE_XENDIT_SECRET_KEY;
const IS_DEVELOPMENT = import.meta.env.MODE === "development";

const xenditAxios = axios.create({
  baseURL: XENDIT_API_URL,
  headers: {
    Authorization: `Basic ${btoa(XENDIT_SECRET_KEY + ":")}`,
    "Content-Type": "application/json",
  },
});

// Error handling utility
const handleXenditError = (error: any) => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error("Xendit API Error:", error.response?.data || error);
  throw new Error(errorMessage || "Payment processing failed");
};

// Create a token for the card first
export const createCardToken = async (cardData: {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
}) => {
  try {
    const response = await xenditAxios.post("/v2/card_tokens", cardData);
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create a charge using the token
export const createCardCharge = async (
  tokenId: string,
  amount: number,
  description: string
) => {
  try {
    const response = await xenditAxios.post("/credit_card_charges", {
      token_id: tokenId,
      external_id: `charge-${Date.now()}`,
      amount,
      currency: "PHP",
      capture: true,
      description,
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create customer in Xendit
export const createCustomer = async (
  name: string,
  email: string,
  mobileNumber?: string
) => {
  try {
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ") || firstName;

    const response = await xenditAxios.post("/customers", {
      reference_id: `cust-${Date.now()}`,
      type: "INDIVIDUAL",
      individual_detail: {
        given_names: firstName,
        surname: lastName,
      },
      email,
      mobile_number: mobileNumber || "+639123456789", // Provide default for development
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create a subscription plan in Xendit
export const createSubscriptionPlan = async (
  name: string,
  amount: number,
  interval: "month" | "year"
) => {
  try {
    const response = await xenditAxios.post("/recurring/plans", {
      reference_id: `plan-${Date.now()}`,
      currency: "PHP",
      amount: amount,
      interval: interval.toUpperCase(),
      interval_count: 1,
      name: name,
      description: `${name} Subscription Plan`,
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create a payment method
export const createPaymentMethod = async (
  customerId: string,
  tokenId: string,
  cardInfo: any
) => {
  try {
    const response = await xenditAxios.post("/payment_methods", {
      type: "CARD",
      customer_id: customerId,
      reference_id: `pm-${Date.now()}`,
      card: {
        token_id: tokenId,
        ...cardInfo
      }
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create a subscription for a customer
export const createSubscription = async (
  planId: string,
  customerId: string,
  paymentMethodId: string
) => {
  try {
    const response = await xenditAxios.post("/recurring/subscriptions", {
      plan_id: planId,
      customer_id: customerId,
      payment_method_id: paymentMethodId,
      recurring_action: "PAYMENT",
      success_return_url: `${window.location.origin}/subscription?status=success`,
      failure_return_url: `${window.location.origin}/subscription?status=failed`,
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Get subscription details
export const getSubscriptionDetails = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.get(`/recurring/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Get subscription status
export const getSubscriptionStatus = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.get(
      `/recurring_payments/subscriptions/${subscriptionId}`
    );
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Get invoice status
export const getInvoiceStatus = async (invoiceId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create e-wallet charge
export const createEWalletCharge = async (
  ewalletType: 'GCASH' | 'GRABPAY' | 'PAYMAYA',
  amount: number,
  description: string
) => {
  try {
    const response = await xenditAxios.post("/ewallets/charges", {
      reference_id: `ewallet-${Date.now()}`,
      currency: "PHP",
      amount: amount,
      checkout_method: "ONE_TIME_PAYMENT",
      channel_code: ewalletType,
      channel_properties: {
        success_redirect_url: `${window.location.origin}/subscription?status=success`,
        failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      },
      metadata: {
        description: description
      }
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Pause subscription
export const pauseSubscription = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.post(
      `/recurring_payments/subscriptions/${subscriptionId}/pause`
    );
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Resume subscription
export const resumeSubscription = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.post(
      `/recurring_payments/subscriptions/${subscriptionId}/resume`
    );
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Stop subscription
export const stopSubscription = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.post(
      `/recurring_payments/subscriptions/${subscriptionId}/stop`
    );
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Get payment methods for a customer
export const getPaymentMethods = async (customerId: string) => {
  try {
    const response = await xenditAxios.get(`/payment_methods`, {
      params: { customer_id: customerId }
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};