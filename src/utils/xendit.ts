import axios from "axios"

const XENDIT_API_URL = "https://api.xendit.co"
const XENDIT_SECRET_KEY = import.meta.env.VITE_XENDIT_SECRET_KEY
const IS_DEVELOPMENT = import.meta.env.MODE === "development"

const xenditAxios = axios.create({
  baseURL: XENDIT_API_URL,
  headers: {
    Authorization: `Basic ${btoa(XENDIT_SECRET_KEY + ":")}`,
    "Content-Type": "application/json",
  },
})

// Error handling utility
const handleXenditError = (error: any) => {
  const errorMessage = error.response?.data?.message || error.message
  console.error("Xendit API Error:", error.response?.data || error)
  throw new Error(errorMessage || "Payment processing failed")
}

// Create invoice for e-wallet payments
export const createInvoice = async (amount: number, description: string) => {
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
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Create card token for credit card payments
export const createCardToken = async (cardData: {
  card_number: string
  exp_month: number
  exp_year: number
  cvc: string
}) => {
  try {
    const response = await xenditAxios.post("/v2/credit_card_tokens", {
      card_number: cardData.card_number.replace(/\s/g, ""),
      card_exp_month: cardData.exp_month,
      card_exp_year: cardData.exp_year,
      card_cvn: cardData.cvc,
      is_multiple_use: true, // Enable for subscription renewals
      should_authenticate: true,
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Create card charge
export const createCardCharge = async (tokenId: string, amount: number, description: string) => {
  try {
    const response = await xenditAxios.post("/credit_card_charges", {
      token_id: tokenId,
      external_id: `charge-${Date.now()}`,
      amount,
      currency: "PHP",
      description,
      capture: true,
      authentication_id: tokenId,
      recurring: true, // Enable for subscription charges
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Create recurring payment
export const createRecurringPayment = async (
  tokenId: string,
  amount: number,
  interval: "month" | "year",
  description: string,
) => {
  try {
    const response = await xenditAxios.post("/recurring_payments", {
      external_id: `recurring-${Date.now()}`,
      token_id: tokenId,
      amount,
      currency: "PHP",
      interval,
      description,
      failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      success_redirect_url: `${window.location.origin}/subscription?status=success`,
      schedule: {
        interval_count: 1,
        start_date: new Date().toISOString(),
        timezone: "Asia/Manila",
      },
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Get payment status
export const getPaymentStatus = async (paymentId: string) => {
  try {
    const response = await xenditAxios.get(`/credit_card_charges/${paymentId}`)
    return {
      status: response.data.status,
      failureReason: response.data.failure_reason,
      lastAttemptStatus: response.data.last_attempt_status,
    }
  } catch (error) {
    handleXenditError(error)
  }
}

// Stop recurring payment
export const stopRecurringPayment = async (recurringPaymentId: string) => {
  try {
    const response = await xenditAxios.post(`/recurring_payments/${recurringPaymentId}/stop`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Retry failed payment
export const retryFailedPayment = async (paymentId: string) => {
  try {
    const response = await xenditAxios.post(`/credit_card_charges/${paymentId}/retry`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Get invoice status
export const getInvoiceStatus = async (invoiceId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/invoices/${invoiceId}`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Create e-wallet charge
export const createEWalletCharge = async (
  type: "GCASH" | "GRABPAY" | "PAYMAYA",
  amount: number,
  description: string,
) => {
  try {
    const response = await xenditAxios.post("/ewallets/charges", {
      reference_id: `ewallet-${Date.now()}`,
      currency: "PHP",
      amount,
      checkout_method: "ONE_TIME_PAYMENT",
      channel_code: type,
      channel_properties: {
        success_redirect_url: `${window.location.origin}/subscription?status=success`,
        failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      },
      metadata: {
        description,
      },
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}
// Create a subscription plan in Xendit
export const createSubscriptionPlan = async (
  customerId: string,
  amount: number,
  interval: "DAY" | "WEEK" | "MONTH" | "YEAR",
  intervalCount: number,
  planName: string,
  totalRecurrence = 12,
) => {
  try {
    const response = await xenditAxios.post("/recurring/plans", {
      reference_id: `plan-${Date.now()}`,
      customer_id: customerId,
      recurring_action: "PAYMENT",
      currency: "PHP",
      amount: amount,
      schedule: {
        reference_id: `schedule-${Date.now()}`,
        interval: interval,
        interval_count: intervalCount,
        total_recurrence: totalRecurrence,
        anchor_date: new Date().toISOString(),
        retry_interval: "DAY",
        retry_interval_count: 3,
        total_retry: 2,
        failed_attempt_notifications: [1, 2],
      },
      immediate_action_type: "FULL_AMOUNT",
      notification_config: {
        recurring_created: ["EMAIL"],
        recurring_succeeded: ["EMAIL"],
        recurring_failed: ["EMAIL"],
        locale: "en",
      },
      failed_cycle_action: "STOP",
      payment_link_for_failed_attempt: true,
      description: planName,
      success_return_url: `${window.location.origin}/subscription?status=success`,
      failure_return_url: `${window.location.origin}/subscription?status=failed`,
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Activate a subscription plan
export const activateSubscriptionPlan = async (planId: string, paymentMethodId: string) => {
  try {
    const response = await xenditAxios.post(`/recurring/plans/${planId}/activate`, {
      payment_method_id: paymentMethodId,
    })
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Create a subscription for a customer
export const createSubscription = async (planId: string, customerId: string, cardToken?: string) => {
  try {
    const subscriptionData: any = {
      plan_id: planId,
      customer_id: customerId,
      immediate_charge: false, // Set to false as we've already charged the customer
      currency: "PHP",
      success_return_url: `${window.location.origin}/subscription?status=success`,
      failure_return_url: `${window.location.origin}/subscription?status=failed`,
      rewrite_return_url: true,
      notification_config: {
        webhook_url: `${window.location.origin}/api/webhooks/xendit`,
        payment_success: true,
        payment_failure: true,
      },
    }

    if (cardToken) {
      subscriptionData.payment_method = {
        type: "CREDIT_CARD",
        token_id: cardToken,
        authentication_id: cardToken,
        card_info: {
          token_id: cardToken,
        },
      }
    }

    const response = await xenditAxios.post("/v2/subscriptions", subscriptionData)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Get subscription status
export const getSubscriptionStatus = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/subscriptions/${subscriptionId}`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Pause subscription
export const pauseSubscription = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.post(`/v2/subscriptions/${subscriptionId}/pause`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Resume subscription
export const resumeSubscription = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.post(`/v2/subscriptions/${subscriptionId}/resume`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Stop subscription
export const stopSubscription = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.post(`/v2/subscriptions/${subscriptionId}/stop`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Create customer in Xendit
export const createCustomer = async (name: string, email: string, mobileNumber?: string) => {
  try {
    const customerData: any = {
      reference_id: `cust-${Date.now()}`,  
      email,
      type: "INDIVIDUAL",
      individual_detail: {
        given_names: name,
      },
      description: IS_DEVELOPMENT ? "Test customer" : "POS System customer",
    }

    if (mobileNumber) {
      customerData.mobile_number = mobileNumber
    }

    const response = await xenditAxios.post("/customers", customerData)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}

// Add a function to check the plan status
export const getSubscriptionPlanStatus = async (planId: string) => {
  try {
    const response = await xenditAxios.get(`/recurring/plans/${planId}`)
    return response.data
  } catch (error) {
    handleXenditError(error)
  }
}
