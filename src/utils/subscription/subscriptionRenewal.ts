import { addDays } from 'date-fns';
import { createCardToken, createCardCharge } from '../xendit';
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

export const handleAutoRenewal = async (details: RenewalDetails) => {
  try {
    // Get current subscription
    const { data: currentSubscription } = await store.dispatch(
      subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
        forceRefetch: true
      })
    );

    if (!currentSubscription?.paymentDetails?.cardDetails) {
      throw new Error('Card details not found for auto-renewal');
    }

    const cardDetails = currentSubscription.paymentDetails.cardDetails;

    // Create new card token
    const cardToken = await createCardToken({
      card_number: cardDetails.cardNumber,
      exp_month: cardDetails.expMonth,
      exp_year: cardDetails.expYear,
      cvc: '', // CVC not stored for security
    });

    // Create charge
    const charge = await createCardCharge(
      cardToken.id,
      details.amount,
      `Subscription Auto-Renewal - ${details.subscriptionId}`
    );

    if (charge.status === 'CAPTURED') {
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
            paymentId: charge.id,
            amount: details.amount,
            status: 'completed',
            cardDetails
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
        paymentId: charge.id,
        status: 'completed'
      };
    } else {
      throw new Error('Payment failed');
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
      message: error.message || 'Failed to process auto-renewal'
    };
  }
};