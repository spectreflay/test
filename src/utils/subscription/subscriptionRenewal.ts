import { addDays } from 'date-fns';
import { createPaymentIntent, createPaymentMethod } from '../paymongo';
import { store } from '../../store';
import { subscriptionApi } from '../../store/services/subscriptionService';
import { createNotification } from '../notification';
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
    cardHolder: string;
  };
}

export const handleAutoRenewal = async (details: RenewalDetails) => {
  try {
    if (!details.cardDetails) {
      // For e-wallet payments, we can't auto-renew
      await createNotification(
        store.dispatch,
        'Your subscription requires manual renewal as it was paid via e-wallet.',
        'alert'
      );
      return {
        success: false,
        status: 'manual_renewal_required',
        message: 'E-wallet payments require manual renewal',
      };
    }

    // Create payment method
    const paymentMethod = await createPaymentMethod({
      type: 'card',
      details: {
        card_number: details.cardDetails.cardNumber,
        exp_month: details.cardDetails.expMonth,
        exp_year: details.cardDetails.expYear,
        cvc: details.cardDetails.cvc,
      },
      billing: {
        name: details.cardDetails.cardHolder,
        email: 'customer@example.com', // Get from user profile
      },
    });

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: details.amount,
      paymentMethodAllowed: ['card'],
      paymentMethodId: paymentMethod.id,
      description: 'Subscription Auto Renewal',
      currency: 'PHP',
    });

    if (paymentIntent.attributes.status === 'succeeded') {
      // Calculate new subscription dates
      const startDate = new Date();
      const endDate = details.billingCycle === 'yearly' 
        ? addDays(startDate, 365)
        : addDays(startDate, 30);

      // Update subscription
      await store.dispatch(
        subscriptionApi.endpoints.subscribe.initiate({
          subscriptionId: details.subscriptionId,
          paymentMethod: 'card',
          billingCycle: details.billingCycle,
          autoRenew: true,
          paymentDetails: {
            paymentId: paymentIntent.id,
            amount: details.amount,
            status: 'completed',
          },
        })
      ).unwrap();

      // Notify user
      await createNotification(
        store.dispatch,
        'Your subscription has been automatically renewed.',
        'system'
      );

      toast.success('Subscription renewed successfully');

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: 'completed',
      };
    } else {
      throw new Error('Payment failed');
    }
  } catch (error) {
    console.error('Auto-renewal failed:', error);
    
    // Notify user of failed renewal
    await createNotification(
      store.dispatch,
      'Automatic subscription renewal failed. Please update your payment method or renew manually.',
      'alert'
    );

    toast.error('Failed to renew subscription');

    return {
      success: false,
      status: 'failed',
      message: 'Failed to process auto-renewal',
    };
  }
};

export const scheduleAutoRenewal = (details: RenewalDetails, daysBeforeExpiry: number = 3) => {
  const now = new Date();
  const renewalDate = new Date();
  renewalDate.setDate(renewalDate.getDate() + (details.billingCycle === 'yearly' ? 362 : 27)); // 3 days before expiry

  const timeUntilRenewal = renewalDate.getTime() - now.getTime();
  
  if (timeUntilRenewal > 0) {
    setTimeout(async () => {
      const result = await handleAutoRenewal(details);
      
      if (!result.success) {
        // Retry once after 24 hours if failed
        setTimeout(async () => {
          await handleAutoRenewal(details);
        }, 24 * 60 * 60 * 1000);
      }
    }, timeUntilRenewal);
  }
};