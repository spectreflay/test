import { addDays, format } from 'date-fns';
import { store } from '../../store';
import { subscriptionApi } from '../../store/services/subscriptionService';
import { createNotification } from '../notification';
import { SUBSCRIPTION_FEATURES } from './subscriptionFeatures';
import { handleAutoRenewal } from './subscriptionRenewal';

class SubscriptionManager {
  private static instance: SubscriptionManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly RENEWAL_WARNING_DAYS = 3; // Days before expiration to warn user

  private constructor() {
    this.startExpirationCheck();
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public getSubscriptionDetails(subscription: any) {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const warningDate = addDays(endDate, -this.RENEWAL_WARNING_DAYS);
    
    return {
      isExpired: now > endDate,
      isNearExpiration: now >= warningDate && now < endDate,
      features: subscription.subscription.features,
      limits: {
        products: subscription.subscription.maxProducts,
        staff: subscription.subscription.maxStaff,
        stores: subscription.subscription.maxStores
      },
      tier: subscription.subscription.name,
      expiryDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      paymentMethod: subscription.paymentMethod
    };
  }

 // Update the checkAndUpdateSubscriptionStatus method
private async checkAndUpdateSubscriptionStatus() {
  try {
    const result = await store.dispatch(
      subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
        forceRefetch: true
      })
    );

    if (!result.data) return;

    const subscription = result.data;
    const details = this.getSubscriptionDetails(subscription);
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const warningDate = addDays(endDate, -this.RENEWAL_WARNING_DAYS);

    // Handle near expiration warning
    if (details.isNearExpiration && subscription.status === 'active') {
      const message = subscription.autoRenew
        ? `Your subscription will be automatically renewed on ${format(endDate, 'MMM dd, yyyy')}.`
        : `Your subscription will expire on ${format(endDate, 'MMM dd, yyyy')}. Please renew to avoid service interruption.`;
      
      await createNotification(
        store.dispatch,
        message,
        subscription.autoRenew ? 'info' : 'alert'
      );
    }

    // Handle expired subscription - Xendit will handle the renewal automatically
    if (details.isExpired && subscription.status !== 'expired' && !subscription.autoRenew) {
      await store.dispatch(
        subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
          status: 'expired'
        })
      );
      await this.applyFreePlan();
      await createNotification(
        store.dispatch,
        'Your subscription has expired. Please renew to restore access to premium features.',
        'alert'
      );
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
  }
}
  private async applyFreePlan() {
    try {
      const result = await store.dispatch(
        subscriptionApi.endpoints.getSubscriptions.initiate(undefined, {
          forceRefetch: true
        })
      );

      const freeTier = result.data?.find(sub => sub.name === 'free');
      if (freeTier) {
        await store.dispatch(
          subscriptionApi.endpoints.subscribe.initiate({
            subscriptionId: freeTier._id,
            paymentMethod: 'free',
            billingCycle: 'monthly',
            paymentDetails: {
              status: 'completed'
            }
          })
        ).unwrap();

        await store.dispatch(
          subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
            forceRefetch: true
          })
        );
      }
    } catch (error) {
      console.error('Error applying free plan:', error);
    }
  }

  private startExpirationCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Run initial check
    this.checkAndUpdateSubscriptionStatus();

    // Set up periodic checks
    this.checkInterval = setInterval(
      () => this.checkAndUpdateSubscriptionStatus(),
      this.CHECK_INTERVAL
    );
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();