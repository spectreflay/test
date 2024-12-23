// src/utils/subscriptionMiddleware.ts
import { handleAutoRenewal } from './subscriptionRenewal';
import { createNotification } from './notification';
import { store } from '../store';

export const handleSubscriptionExpiration = async (subscription: any) => {
  if (!subscription.endDate) return;

  const endDate = new Date(subscription.endDate);
  const now = new Date();

  // If subscription is expired
  if (endDate < now) {
    if (subscription.autoRenew && subscription.paymentMethod === 'card') {
      // Attempt auto-renewal for credit card payments
      const result = await handleAutoRenewal({
        subscriptionId: subscription.subscription._id,
        amount: subscription.billingCycle === 'yearly' 
          ? subscription.subscription.yearlyPrice 
          : subscription.subscription.monthlyPrice,
        billingCycle: subscription.billingCycle,
        cardDetails: subscription.paymentDetails?.cardDetails,
      });

      if (result.success) {
        await createNotification(
          store.dispatch,
          'Your subscription has been automatically renewed.',
          'system'
        );
      } else {
        await createNotification(
          store.dispatch,
          'Auto-renewal failed. Please update your payment method.',
          'alert'
        );
      }
    } else if (['gcash', 'grab_pay', 'maya'].includes(subscription.paymentMethod)) {
      // For e-wallet payments, notify user to renew manually
      await createNotification(
        store.dispatch,
        'Your subscription has expired. Please renew manually.',
        'alert'
      );
    }
  }
};
