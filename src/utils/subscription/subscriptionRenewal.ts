import { createRecurringPayment, stopRecurringPayment } from '../xendit';
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
    cardHolder: string;
  };
}

export const setupRecurringPayment = async (details: RenewalDetails, tokenId: string) => {
  try {
    // Create recurring payment with Xendit
    const recurringPayment = await createRecurringPayment(
      tokenId,
      details.amount,
      details.billingCycle,
      `Subscription - ${details.subscriptionId}`
    );

    // Update subscription with recurring payment ID
    await store.dispatch(
      subscriptionApi.endpoints.subscribe.initiate({
        subscriptionId: details.subscriptionId,
        paymentMethod: 'card',
        billingCycle: details.billingCycle,
        autoRenew: true,
        paymentDetails: {
          paymentId: recurringPayment.id,
          recurringPaymentId: recurringPayment.recurring_payment_id,
          amount: details.amount,
          status: 'active',
          cardDetails: details.cardDetails
        },
      })
    ).unwrap();

    await createNotification(
      store.dispatch,
      'Automatic subscription renewal has been set up successfully.',
      'system'
    );

    toast.success('Subscription auto-renewal configured successfully');

    return {
      success: true,
      recurringPaymentId: recurringPayment.recurring_payment_id
    };
  } catch (error: any) {
    console.error('Failed to set up recurring payment:', error);
    
    await createNotification(
      store.dispatch,
      'Failed to set up automatic subscription renewal.',
      'alert'
    );

    toast.error('Failed to set up auto-renewal');

    return {
      success: false,
      error: error.message
    };
  }
};

export const cancelRecurringPayment = async (recurringPaymentId: string) => {
  try {
    await stopRecurringPayment(recurringPaymentId);
    
    await store.dispatch(
      subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
        status: 'cancelled',
        autoRenew: false
      })
    ).unwrap();

    await createNotification(
      store.dispatch,
      'Subscription auto-renewal has been cancelled.',
      'system'
    );

    toast.success('Auto-renewal cancelled successfully');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to cancel recurring payment:', error);
    
    await createNotification(
      store.dispatch,
      'Failed to cancel automatic subscription renewal.',
      'alert'
    );

    toast.error('Failed to cancel auto-renewal');

    return {
      success: false,
      error: error.message
    };
  }
};