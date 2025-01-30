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

// Create customer in Xendit
export const createCustomer = async (
  name: string,
  email: string,
) => {
  try {
    const response = await xenditAxios.post("/customers", {
      reference_id: `cust-${Date.now()}`,
      type: "INDIVIDUAL",
      individual_detail: {
        given_names: name,
      },
      email,
      description: IS_DEVELOPMENT ? "Test customer" : "POS System customer",
    });
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

// Create a subscription for a customer
export const createSubscription = async (
  referenceId: string,
  customerId: string,
  amount: number
) => {
  try {
    const response = await xenditAxios.post("/recurring/plans", {
      reference_id: referenceId,
      customer_id: customerId,
      recurring_action: "PAYMENT",
      currency: "PHP",
      amount,
      payment_methods: [], // Required for linking UI
      schedule: {
        reference_id: referenceId,
        interval: "MONTH",
        interval_count: 1,
        total_recurrence: 12,
        anchor_date: "2022-02-15T16:23:52Z",
        retry_interval: "DAY",
        retry_interval_count: 3,
        total_retry: 2,
        failed_attempt_notifications: [1, 2],
      },
      immediate_action_type: "FULL_AMOUNT",
      failed_cycle_action: "STOP",
      payment_link_for_failed_attempt: true,
      metadata: null,
      description: "POS Subscription",
      items: [
        {
          type: "DIGITAL_SERVICE",
          name: "premium",
          net_unit_amount: amount,
          quantity: 1,
          url: "https://www.xendit.co/",
          category: "Gaming",
          subcategory: "Open World",
        },
      ],
      success_return_url: "https://www.xendit.co/successisthesumoffailures",
      failure_return_url: "https://www.xendit.co/failureisthemotherofsuccess",
    });

    // Find the AUTH linking URL from actions array
    const linkingAction = response.data.actions?.find(
      (action:any) => action.action === "AUTH"
    );
    const linkingUrl = linkingAction?.url || null;

    return { ...response.data, linkingUrl };
  } catch (error) {
    handleXenditError(error);
  }
};


// Get subscription status
export const getSubscriptionStatus = async (subscriptionId: string) => {
  try {
    const response = await xenditAxios.get(`/recurring/plans/${subscriptionId}`);
    return response.data;
  } catch (error) {
    handleXenditError(error);
  }
};

