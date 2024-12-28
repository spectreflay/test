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
  interval: "month" | "year"
) => {
  try {
    const referenceId = `plan-${Date.now()}`;
    
    // Log the interval value for debugging
    console.log("Interval value before API call:", interval.toUpperCase());

    const response = await xenditAxios.post("/recurring/plans", {
      reference_id: referenceId,
      customer_id: "cust-239c16f4-866d-43e8-9341-7badafbc019f", // This will be replaced with actual customer ID
      recurring_action: "PAYMENT",
      currency: "PHP",
      amount: amount,
      payment_methods: [{
        payment_method_id: "pm-asdaso213897821hdas", // This will be replaced with actual payment method ID
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
    if (invoice.status !== "PAID") {
      throw new Error("Invoice must be paid to create payment method");
    }

    const response = await xenditAxios.post("/payment_methods", {
      type: invoice.payment_method,
      customer_id: customerId,
      reference_id: `pm-${Date.now()}`,
      billing_information: {
        email: invoice.customer.email,
        name: `${invoice.customer.given_names} ${invoice.customer.surname || ""}`,
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