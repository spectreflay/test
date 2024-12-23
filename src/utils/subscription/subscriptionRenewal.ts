import { createPaymentIntent, createPaymentMethod } from '../paymongo';
import { toast } from 'react-hot-toast';

interface RenewalDetails {
  subscriptionId: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  cardDetails?: {
    cardNumber: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  };
}

export const handleAutoRenewal = async (details: RenewalDetails) => {
  try {
    if (details.cardDetails) {
      // Handle credit card renewal
      const paymentMethod = await createPaymentMethod({
        type: 'card',
        details: details.cardDetails,
        billing: {
          name: 'Auto Renewal',
        },
      });

      const paymentIntent = await createPaymentIntent({
        amount: details.amount,
        paymentMethodAllowed: ['card'],
        paymentMethodId: paymentMethod.id,
        description: 'Subscription Auto Renewal',
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: 'completed',
      };
    } else {
      // For e-wallet payments, we can't auto-renew
      return {
        success: false,
        status: 'manual_renewal_required',
        message: 'E-wallet payments require manual renewal',
      };
    }
  } catch (error) {
    console.error('Auto-renewal failed:', error);
    return {
      success: false,
      status: 'failed',
      message: 'Failed to process auto-renewal',
    };
  }
};
