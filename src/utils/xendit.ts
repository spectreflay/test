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

// Create invoice for initial payment
export const createInvoice = async (
  amount: number,
  description: string,
  customerId?: string
) => {
  try {
    const response = await xenditAxios.post("/v2/invoices", {
      external_id: `inv-${Date.now()}`,
      amount,
      description,
      currency: "PHP",
      payment_methods: ["GCASH", "GRABPAY", "PAYMAYA", "CREDIT_CARD"],
      success_redirect_url: `${window.location.origin}/subscription?status=success&payment_id={id}`,
      failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      invoice_duration: 86400, // 24 hours
      should_send_email: true,
      reminder_time: 1, // Send reminder after 1 hour
      customer_id: customerId, // Link invoice to customer if provided
      items: [
        {
          name: description,
          quantity: 1,
          price: amount,
          category: "Subscription",
        },
      ],
      customer: IS_DEVELOPMENT
        ? {
            email: "test@example.com",
            given_names: "Test",
            surname: "User",
          }
        : undefined,
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
    const response = await xenditAxios.post("/customers", {
      reference_id: `cust-${Date.now()}`,
      email,
      mobile_number: mobileNumber,
      type: "INDIVIDUAL",
      description: IS_DEVELOPMENT ? "Test customer" : "POS System customer",
      individual_detail: {
        given_names: name.split(" ")[0],
        surname: name.split(" ").slice(1).join(" ") || name.split(" ")[0],
      },
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
      customer_id: "cust-00000000-0000-0000-0000-000000000000", // Replace with actual customer ID
      recurring_action: "PAYMENT",
      currency: "PHP",
      amount: amount,
      payment_methods: [
        {
          payment_method_id: "pm-00000000-0000-0000-0000-000000000000", // Replace with actual payment method ID
          rank: 1,
          type: "CREDIT_CARD",
          reusability: "MULTIPLE_USE",
          status: "ACTIVE"
        },
        {
          payment_method_id: "pm-11111111-1111-1111-1111-111111111111", // Replace with actual payment method ID
          rank: 2,
          type: "DIRECT_DEBIT",
          reusability: "MULTIPLE_USE",
          status: "ACTIVE"
        }
      ],
      description: `${name} subscription plan`,
      success_return_url: `${window.location.origin}/subscription?status=success`,
      failure_return_url: `${window.location.origin}/subscription?status=failed`,
      schedule: {
        interval_count: 1,
        interval: interval.toUpperCase(),
        total_recurrence: 0, // 0 means it will recur indefinitely
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
    const response = await xenditAxios.post(
      "/recurring_payments/subscriptions",
      {
        reference_id: `sub-${Date.now()}`,
        plan_id: planId,
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        immediate_charge: true,
        currency: "PHP",
        success_return_url: `${window.location.origin}/subscription?status=success`,
        failure_return_url: `${window.location.origin}/subscription?status=failed`,
        rewrite_return_url: true,
        notification_config: {
          payment_success: true,
          payment_failure: true,
        },
      }
    );
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

// Get invoice status and payment method
export const getInvoiceStatus = async (invoiceId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create payment method from successful invoice
export const createPaymentMethodFromInvoice = async (
  invoiceId: string,
  customerId: string
) => {
  try {
    const invoice = await getInvoiceStatus(invoiceId);
    if (invoice.status !== "PAID") {
      throw new Error("Invoice must be paid to create payment method");
    }

    // Create payment method from the successful payment
    const response = await xenditAxios.post("/payment_methods", {
      type: invoice.payment_method,
      customer_id: customerId,
      reference_id: `pm-${Date.now()}`,
      billing_information: {
        email: invoice.customer.email,
        name:
          invoice.customer.given_names + " " + (invoice.customer.surname || ""),
      },
      metadata: {
        invoice_id: invoiceId,
      },
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

