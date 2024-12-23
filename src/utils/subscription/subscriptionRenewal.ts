import { createPaymentIntent, confirmPaymentIntent } from '../paymongo';
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

    console.log('Creating payment intent with:', {
      amount: details.amount,
      paymentMethodId,
      description: 'Subscription Auto Renewal',
      currency: 'PHP',
      setupFutureUsage: 'off_session'
    });

    // Create payment intent with the existing payment method
    let paymentIntent = await createPaymentIntent({
      amount: details.amount,
      paymentMethodAllowed: ['card'],
      paymentMethodId: paymentMethodId,
      description: 'Subscription Auto Renewal',
      currency: 'PHP',
      setupFutureUsage: 'off_session' // Enable future usage without CVV
    });

    console.log('Payment intent created:', paymentIntent);

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

      case 'awaiting_payment_method':
        // Attempt to confirm the payment intent
        paymentIntent = await confirmPaymentIntent(paymentIntent.id, paymentMethodId);
        
        if (paymentIntent.attributes.status === 'succeeded') {
          // Handle successful confirmation similarly to the 'succeeded' case
          // (You might want to extract this into a separate function to avoid code duplication)
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
        } else {
          throw new Error(`Payment confirmation failed. Status: ${paymentIntent.attributes.status}`);
        }

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
        };

      default:
        // Handle other non-success statuses
        throw new Error(`Unexpected payment intent status: ${paymentIntent.attributes.status}`);
    }
  } catch (error) {
    console.error('Auto-renewal failed:', error);
    
    if (error.response && error.response.data && error.response.data.errors) {
      const paymongoError = error.response.data.errors[0];
      if (paymongoError.code === 'parameter_attached_state') {
        // Handle the specific error for already attached payment method
        await createNotification(
          store.dispatch,
          'Auto-renewal failed: Payment method is already attached. Please update your payment method.',
          'alert'
        );
      } else {
        // Handle other Paymongo errors
        await createNotification(
          store.dispatch,
          `Auto-renewal failed: ${paymongoError.detail}`,
          'alert'
        );
      }
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

