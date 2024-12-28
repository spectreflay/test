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

interface CardTokenRequest {
  card_number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
}

interface EWalletChargeRequest {
  reference_id: string;
  currency: string;
  amount: number;
  checkout_method: string;
  channel_code: string;
  channel_properties: {
    success_redirect_url: string;
    failure_redirect_url: string;
  };
}

// Create invoice for e-wallet payments
export const createInvoice = async (amount: number, description: string) => {
  try {
    const response = await xenditAxios.post('/v2/invoices', {
      external_id: `inv-${Date.now()}`,
      amount,
      description,
      currency: 'PHP',
      payment_methods: ['GCASH', 'GRABPAY', 'PAYMAYA', 'CREDIT_CARD'],
      success_redirect_url: `${window.location.origin}/subscription?status=success&payment_id={id}`,
      failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      invoice_duration: 86400, // 24 hours
      should_send_email: true,
      reminder_time: 1, // Send reminder after 1 hour
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating invoice:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create invoice');
  }
};

// Create card token for credit card payments
export const createCardToken = async (cardData: CardTokenRequest) => {
  try {
    // Basic card validation
    if (!validateCard(cardData)) {
      throw new Error('Invalid card details');
    }

    const response = await xenditAxios.post('/v2/credit_card_tokens', {
      card_number: cardData.card_number.replace(/\s/g, ''),
      card_exp_month: cardData.exp_month,
      card_exp_year: cardData.exp_year,
      card_cvn: cardData.cvc,
      is_multiple_use: false,
      should_authenticate: true,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error creating card token:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to process card');
  }
};

// Create card charge
export const createCardCharge = async (tokenId: string, amount: number, description: string) => {
  try {
    const response = await xenditAxios.post('/credit_card_charges', {
      token_id: tokenId,
      external_id: `charge-${Date.now()}`,
      amount,
      currency: 'PHP',
      description,
      capture: true,
      authentication_id: tokenId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error charging card:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to charge card');
  }
};

// Get invoice status
export const getInvoiceStatus = async (invoiceId: string) => {
  try {
    const response = await xenditAxios.get(`/v2/invoices/${invoiceId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting invoice status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get invoice status');
  }
};

// Create e-wallet charge
export const createEWalletCharge = async (type: 'GCASH' | 'GRABPAY' | 'PAYMAYA', amount: number, description: string) => {
  try {
    const request: EWalletChargeRequest = {
      reference_id: `ewallet-${Date.now()}`,
      currency: 'PHP',
      amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: type,
      channel_properties: {
        success_redirect_url: `${window.location.origin}/subscription?status=success`,
        failure_redirect_url: `${window.location.origin}/subscription?status=failed`,
      },
    };

    const response = await xenditAxios.post('/ewallets/charges', request);
    return response.data;
  } catch (error: any) {
    console.error('Error creating e-wallet charge:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to create e-wallet charge');
  }
};

// Card validation helper functions
const validateCard = (cardData: CardTokenRequest): boolean => {
  // Validate card number (Luhn algorithm)
  const isValidCardNumber = (number: string): boolean => {
    const digits = number.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validate expiry date
  const isValidExpiry = (month: number, year: number): boolean => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  };

  // Validate CVV (3-4 digits)
  const isValidCVV = (cvv: string): boolean => {
    return /^[0-9]{3,4}$/.test(cvv);
  };

  return (
    isValidCardNumber(cardData.card_number) &&
    isValidExpiry(cardData.exp_month, cardData.exp_year) &&
    isValidCVV(cardData.cvc)
  );
};