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
}

export const handleAutoRenewal = async (details: RenewalDetails) => {
  try {
    // Get current subscription
    const { data: currentSubscription } = await store.dispatch(
      subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
        forceRefetch: true
      })
    );

    if (!currentSubscription?.paymentDetails?.paymentMethodId) {
      await createNotification(
        store.dispatch,
        'Unable to process auto-renewal: Payment method not found.',
        'alert'
      );
      return {
        success: false,
        status: 'payment_method_missing',
        message: 'Payment method not found for auto-renewal',
      };
    }

    // Create payment intent with the saved payment method
    const paymentIntent = await createPaymentIntent({
      amount: details.amount,
      paymentMethodAllowed: ['card'],
      paymentMethodId: currentSubscription.paymentDetails.paymentMethodId,
      description: 'Subscription Auto Renewal',
      currency: 'PHP',
      setupFutureUsage: 'off_session' // Enable future usage without CVV
    });

    if (paymentIntent.attributes.status === 'succeeded') {
      // Update subscription with new payment
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
            paymentMethodId: currentSubscription.paymentDetails.paymentMethodId,
            cardDetails: currentSubscription.paymentDetails.cardDetails
          },
        })
      ).unwrap();

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
    }

    throw new Error('Payment failed');
  } catch (error) {
    console.error('Auto-renewal failed:', error);
    
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