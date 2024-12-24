import { createPaymentIntent, confirmPaymentIntent, getPaymentIntentStatus } from '../paymongo';
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

    let paymentMethodId = currentSubscription.paymentDetails.paymentMethodId;

    // Prepare metadata as a flat object
    const metadata: Record<string, string> = {
      subscriptionId: details.subscriptionId,
      billingCycle: details.billingCycle,
      renewalType: 'auto'
    };

    console.log('Creating payment intent for auto-renewal:', {
      amount: details.amount,
      currency: 'PHP',
      description: 'Subscription Auto Renewal',
      metadata
    });

    // Create payment intent without specifying the payment method
    let paymentIntent = await createPaymentIntent({
      amount: details.amount,
      currency: 'PHP',
      description: 'Subscription Auto Renewal',
      metadata,
      setupFutureUsage: 'off_session',
    });

    console.log('Payment intent created:', paymentIntent);

    // Confirm the payment intent with the existing payment method
    try {
      paymentIntent = await confirmPaymentIntent(paymentIntent.id, paymentMethodId);
      console.log('Payment intent confirmed:', paymentIntent);
    } catch (confirmError) {
      console.error('Error confirming payment intent:', confirmError);
      throw new Error('Failed to confirm payment intent');
    }

    // Handle different payment intent statuses
    switch (paymentIntent.attributes.status) {
      case 'succeeded':
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
              paymentMethodId: paymentMethodId,
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

      case 'requires_action':
        // Handle 3D Secure authentication if required
        await createNotification(
          store.dispatch,
          'Your subscription renewal requires additional authentication. Please check your email or login to complete the process.',
          'alert'
        );
        return {
          success: false,
          status: 'requires_action',
          message: 'Additional authentication required for renewal',
          nextAction: paymentIntent.attributes.next_action
        };

      default:
        // Handle other non-success statuses
        throw new Error(`Unexpected payment intent status: ${paymentIntent.attributes.status}`);
    }
  } catch (error) {
    console.error('Auto-renewal failed:', error);
    
    if (error.response && error.response.data && error.response.data.errors) {
      const paymongoError = error.response.data.errors[0];
      // Handle specific PayMongo errors
      await createNotification(
        store.dispatch,
        `Auto-renewal failed: ${paymongoError.detail}`,
        'alert'
      );
    } else {
      // Handle general errors
      await createNotification(
        store.dispatch,
        'Automatic subscription renewal failed. Please update your payment method or renew manually.',
        'alert'
      );
    }

    toast.error('Failed to renew subscription');

    return {
      success: false,
      status: 'failed',
      message: error.message || 'Failed to process auto-renewal',
    };
  }
};

