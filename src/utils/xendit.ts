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
      customer_id: customerId,
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
  interval: "month" | "year",
  customerId: string,
  paymentMethodId: string,
) => {
  try {
    const referenceId = `plan-${Date.now()}`;
    console.log(customerId);
    // Log the interval value for debugging
    console.log("Interval value before API call:", interval.toUpperCase());

    const response = await xenditAxios.post("/recurring/plans", {
      reference_id: referenceId,
      customer_id: customerId, // This will be replaced with actual customer ID
      recurring_action: "PAYMENT",
      currency: "PHP",
      amount: amount,
      payment_methods: [{
        payment_method_id: paymentMethodId, // This will be replaced with actual payment method ID
        rank: 1
      }],
      schedule: {
        reference_id: `schedule-${referenceId}`,
        interval: interval === "month" ? "MONTH" : "YEAR", // Ensure this is in uppercase
        interval_count: 1,
        total_recurrence: interval === "year" ? 1 : 12, // Set to 1 for yearly plans, 12 for monthly
        retry_interval: "DAY",
        retry_interval_count: 3,
        total_retry: 2,
        failed_attempt_notifications: [1, 2]
      },
      immediate_action_type: "FULL_AMOUNT",
      notification_config: {
        recurring_created: ["EMAIL"],
        recurring_succeeded: ["EMAIL"],
        recurring_failed: ["EMAIL"],
        locale: "en"
      },
      failed_cycle_action: "STOP",
      payment_link_for_failed_attempt: true,
      description: `${name} Subscription Plan`,
      items: [
        {
          type: "DIGITAL_PRODUCT",
          name: name,
          net_unit_amount: amount,
          quantity: 1,
          url: window.location.origin,
          category: "Software",
          subcategory: "POS System"
        }
      ],
      success_return_url: `${window.location.origin}/subscription?status=success`,
      failure_return_url: `${window.location.origin}/subscription?status=failed`
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
    const response = await xenditAxios.post("/recurring_payments/subscriptions", {
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
    });
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
    console.log(invoice)
    if (invoice.status !== "PAID") {
      throw new Error("Invoice must be paid to create payment method");
    }

    // For credit card payments, we need to create a reusable payment method
    if (invoice.payment_method === "CREDIT_CARD") {
      const response = await xenditAxios.post("/payment_methods", {
        type: "DEBIT_CARD",
        customer_id: customerId,
        reference_id: `pm-${Date.now()}`,
        card: {
          token_id: invoice.credit_card_charge_id // Use the charge ID as token
        },
        billing_information: {
          email: invoice.customer?.email,
          name: invoice.customer ? 
            `${invoice.customer.given_names} ${invoice.customer.surname || ""}`.trim() : 
            "Unknown Customer"
        },
        metadata: {
          invoice_id: invoiceId
        },
        properties: {
          id: invoice.credit_card_charge_id
        }
      });
      return response.data;
    }

    // For e-wallets, create a payment method with the ewallet type
    if (invoice.payment_method === "EWALLET") {
      const response = await xenditAxios.post("/payment_methods", {
        type: "EWALLET",
        ewallet: {
          channel: invoice.payment_method, // e.g., "GCASH", "GRABPAY", etc.
          channel_properties: {
            success_return_url: invoice.success_redirect_url,
            failure_return_url: invoice.failure_redirect_url
          }
        },
        customer_id: customerId,
        reference_id: `pm-${Date.now()}`,
        billing_information: {
          email: invoice.customer?.email,
          name: invoice.customer ? 
            `${invoice.customer.given_names} ${invoice.customer.surname || ""}`.trim() : 
            "Unknown Customer"
        },
        metadata: {
          invoice_id: invoiceId
        },
      });
      return response.data;
    }

    throw new Error(`Unsupported payment method: ${invoice.payment_method}`);
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

export const getPaymentMethods = async (customerId:string) => {
  try {
    const response = await xenditAxios.get(`/payment_methods`, {
      params: { customer_id: customerId }
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};