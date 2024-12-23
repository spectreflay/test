import { addMinutes } from 'date-fns';
import { store } from '../../store';
import { subscriptionApi, UserSubscription } from '../../store/services/subscriptionService';
import { createNotification } from '../notification';
import { SUBSCRIPTION_FEATURES } from './subscriptionFeatures';

class SubscriptionManager {
  private static instance: SubscriptionManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  private constructor() {
    this.startExpirationCheck();
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public getSubscriptionDetails(subscription: UserSubscription) {
    const isExpired = this.isExpired(subscription);
    const features = subscription.subscription.features;
    const limits = {
      products: isExpired ? 10 : subscription.subscription.maxProducts,
      staff: isExpired ? 2 : subscription.subscription.maxStaff,
      stores: isExpired ? 1 : subscription.subscription.maxStores
    };
    const isNearExpiration = this.isNearExpiration(subscription);
    return {
      isExpired,
      isNearExpiration,
      features,
      limits,
      tier: isExpired ? 'none' : subscription.subscription.name,
      expiryDate: subscription.endDate || null
    };
  }

  public isExpired(subscription: UserSubscription): boolean {
    const now = new Date();
    return new Date(subscription.endDate) < now;
  }

  public isNearExpiration(subscription: UserSubscription, days: number = 1): boolean {
    const now = new Date();
    const expirationDate = new Date(subscription.endDate);
    const warningDate = new Date(expirationDate);
    warningDate.setDate(expirationDate.getDate() - days);
    return now >= warningDate && now < expirationDate;
  }

  private async checkAndUpdateSubscriptionStatus() {
    try {
      // Get current subscription
      const result = await store.dispatch(
        subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
          forceRefetch: true
        })
      );

      if (result.data) {
        const subscription = result.data;
        const now = new Date();
        const endDate = new Date(subscription.endDate);
        const warningDate = addMinutes(endDate, -24 * 60); // 24 hours before expiration

        // Check if subscription is expired
        if (now > endDate && subscription.status !== 'expired') {
          // Update subscription status to expired
          await store.dispatch(
            subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
              status: 'expired'
            })
          );

          // Notify user
          await createNotification(
            store.dispatch,
            'Your subscription has expired. You have been moved to the free plan.',
            'alert'
          );

          // Apply free plan
          await this.applyFreePlan();
        }
        // Check if subscription is about to expire
        else if (now > warningDate && subscription.status === 'active') {
          await createNotification(
            store.dispatch,
            'Your subscription will expire in less than 24 hours. Please renew to avoid service interruption.',
            'alert'
          );
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }

  private async applyFreePlan() {
    try {
      // Get free tier subscription
      const result = await store.dispatch(
        subscriptionApi.endpoints.getSubscriptions.initiate()
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

    this.checkInterval = setInterval(
      () => this.checkAndUpdateSubscriptionStatus(),
      this.CHECK_INTERVAL
    );

    // Run initial check
    this.checkAndUpdateSubscriptionStatus();
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();