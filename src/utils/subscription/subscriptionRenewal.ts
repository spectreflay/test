import { addDays } from 'date-fns';
import { 
  createCardToken, 
  createRecurringPayment, 
  stopRecurringPayment,
  retryFailedPayment 
} from '../xendit';
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
    // Get current subscription
    const { data: currentSubscription } = await store.dispatch(
      subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
        forceRefetch: true
      })
    );

    if (!currentSubscription?.paymentDetails?.cardDetails) {
      await createNotification(
        store.dispatch,
        'Unable to process auto-renewal: Card details not found. Please update your payment method.',
        'alert'
      );
      return {
        success: false,
        status: 'card_details_missing',
        message: 'Card details not found for auto-renewal',
      };
    }

    const cardDetails = currentSubscription.paymentDetails.cardDetails;

    // Create new card token
    const cardToken = await createCardToken({
      card_number: cardDetails.cardNumber,
      exp_month: cardDetails.expMonth,
      exp_year: cardDetails.expYear,
      cvc: cardDetails.cvc || '', // CVC might not be available for renewals
    });

    // Create recurring payment
    const recurringPayment = await createRecurringPayment(
      cardToken.id,
      details.amount,
      details.billingCycle === 'yearly' ? 'year' : 'month',
      `Subscription Auto-Renewal - ${details.subscriptionId}`
    );

    if (recurringPayment.status === 'active') {
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
            paymentId: recurringPayment.id,
            amount: details.amount,
            status: 'completed',
            cardDetails,
            recurringPaymentId: recurringPayment.id
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
        paymentId: recurringPayment.id,
        status: 'completed',
      };
    } else {
      throw new Error('Recurring payment setup failed');
    }
  } catch (error: any) {
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
      message: error.message || 'Failed to process auto-renewal',
    };
  }
};

export const retryFailedRenewal = async (paymentId: string, details: RenewalDetails) => {
  try {
    const retryResult = await retryFailedPayment(paymentId);
    
    if (retryResult.status === 'succeeded') {
      await handleAutoRenewal(details);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to retry renewal:', error);
    return false;
  }
};

export const cancelSubscriptionRenewal = async (recurringPaymentId: string) => {
  try {
    await stopRecurringPayment(recurringPaymentId);
    
    // Update subscription autoRenew status
    await store.dispatch(
      subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
        status: 'active',
        autoRenew: false
      })
    );

    await createNotification(
      store.dispatch,
      'Auto-renewal has been cancelled for your subscription.',
      'system'
    );

    return true;
  } catch (error) {
    console.error('Failed to cancel renewal:', error);
    return false;
  }
};