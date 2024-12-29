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

// Get invoice status and payment method
export const getInvoiceStatus = async (invoiceId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Get credit card charge details
export const getCreditCardChargeDetails = async (chargeId: string) => {
  try {
    const response = await xenditAxios.get(`/credit_card_charges/${chargeId}`);
    console.log('Credit card charge details:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error fetching credit card charge details:', error);
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
    console.log('Invoice details:', JSON.stringify(invoice, null, 2));
    
    if (invoice.status !== "PAID") {
      throw new Error("Invoice must be paid to create payment method");
    }

    // For credit card payments
    if (invoice.payment_method === "CREDIT_CARD") {
      if (!invoice.credit_card_charge_id) {
        throw new Error("Credit card charge ID not found in invoice");
      }

      const chargeDetails = await getCreditCardChargeDetails(invoice.credit_card_charge_id);

      // Log the charge details for debugging
      console.log('Charge details:', JSON.stringify(chargeDetails, null, 2));

      // Check if the charge_type is SINGLE_USE_TOKEN
      if (chargeDetails.charge_type === "SINGLE_USE_TOKEN") {
        console.warn("Warning: This charge used a SINGLE_USE_TOKEN, which may not be suitable for recurring payments.");
      }

      const cardInfo = {
        card_number: chargeDetails.masked_card_number.replace(/X/g, '*'),
        card_type: chargeDetails.card_type,
        currency: chargeDetails.currency,
        card_information: {
          network: chargeDetails.card_brand,
          country: chargeDetails.country_code,
          issuer: chargeDetails.card_issuing_bank,
          type: chargeDetails.card_type,
        },
      };

      // Add expiry month and year only if they are available
      if (chargeDetails.card_expiration_month) {
        cardInfo.expiry_month = chargeDetails.card_expiration_month.toString().padStart(2, '0');
      }
      if (chargeDetails.card_expiration_year) {
        cardInfo.expiry_year = chargeDetails.card_expiration_year.toString();
      }

      // Log the card information we're about to send
      console.log('Card information being sent:', JSON.stringify(cardInfo, null, 2));

      const response = await xenditAxios.post("/v2/payment_methods", {
        type: "CARD",
        customer_id: customerId,
        reference_id: `pm-${Date.now()}`,
        card: cardInfo,
        metadata: {
          invoice_id: invoiceId,
          charge_id: chargeDetails.id,
        }
      });
      
      console.log('Payment method created:', JSON.stringify(response.data, null, 2));
      return response.data;
    }

    // For e-wallets (unchanged)
    if (invoice.payment_method === "EWALLET") {
      const response = await xenditAxios.post("/v2/payment_methods", {
        type: "EWALLET",
        ewallet: {
          channel_code: invoice.payment_channel,
          channel_properties: {
            success_return_url: invoice.success_redirect_url,
            failure_return_url: invoice.failure_redirect_url
          }
        },
        customer_id: customerId,
        reference_id: `pm-${Date.now()}`,
        metadata: {
          invoice_id: invoiceId
        }
      });
      console.log('Payment method created:', response.data);
      return response.data;
    }

    throw new Error(`Unsupported payment method: ${invoice.payment_method}`);
  } catch (error) {
    console.error('Error creating payment method:', error);
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

