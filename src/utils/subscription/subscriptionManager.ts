import { addDays, addMinutes } from 'date-fns';
import { store } from '../../store';
import { subscriptionApi, UserSubscription } from '../../store/services/subscriptionService';
import { createNotification } from '../notification';
import { SUBSCRIPTION_FEATURES } from './subscriptionFeatures';
import { handleAutoRenewal } from './subscriptionRenewal';

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

  public getSubscriptionDetails(subscription: UserSubscription | undefined) {
    if (!subscription) {
      // Handle the case where subscription is undefined
      return {
        isExpired: true,
        isNearExpiration: false,
        features: [],
        limits: {
          products: 0,
          staff: 0,
          stores: 0
        },
        tier: 'none',
        expiryDate: null,
        hasAdvanceRenewal: false,
        nextSubscription: null
      };
    }
  
    const isExpired = this.isExpired(subscription);
    const features = subscription.subscription.features || [];
    const limits = {
      products: isExpired ? 10 : subscription.subscription.maxProducts || 0,
      staff: isExpired ? 2 : subscription.subscription.maxStaff || 0,
      stores: isExpired ? 1 : subscription.subscription.maxStores || 0
    };
    const isNearExpiration = this.isNearExpiration(subscription);
    const hasAdvanceRenewal = !!subscription.nextSubscription;
  
    return {
      isExpired,
      isNearExpiration,
      features,
      limits,
      tier: isExpired ? 'none' : subscription.subscription.name || 'unknown',
      expiryDate: subscription.endDate || null,
      hasAdvanceRenewal,
      nextSubscription: subscription.nextSubscription
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
      const result = await store.dispatch(
        subscriptionApi.endpoints.getCurrentSubscription.initiate(undefined, {
          forceRefetch: true
        })
      );
  
      if (result.data) {
        const subscription = result.data;
        const now = new Date();
        const endDate = new Date(subscription.endDate);
        const warningDate = addDays(endDate, -3); // 3 days before expiration
  
        // Check if subscription is expired
        if (now > endDate && subscription.status !== 'expired') {
          // Check for pending subscription first
          const pendingResult = await store.dispatch(
            subscriptionApi.endpoints.getPendingSubscriptions.initiate()
          );
  
          if (pendingResult.data && pendingResult.data.length > 0) {
            const pendingSubscription = pendingResult.data[0];
  
            // Activate pending subscription
            await store.dispatch(
              subscriptionApi.endpoints.subscribe.initiate({
                subscriptionId: pendingSubscription.subscription._id,
                paymentMethod: pendingSubscription.paymentMethod,
                billingCycle: pendingSubscription.billingCycle,
                paymentDetails: pendingSubscription.paymentDetails,
                startDate: pendingSubscription.startDate,
                endDate: pendingSubscription.endDate
              })
            ).unwrap();
  
            // Update pending subscription status
            await store.dispatch(
              subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
                status: 'active'
              })
            );
  
            await createNotification(
              store.dispatch,
              'Your advance subscription has been activated.',
              'system'
            );
          } else if (subscription.autoRenew && subscription.paymentMethod === 'card') {
            // Attempt auto-renewal if no pending subscription
            const renewalResult = await handleAutoRenewal({
              subscriptionId: subscription.subscription._id,
              amount: subscription.billingCycle === 'yearly' 
                ? subscription.subscription.yearlyPrice 
                : subscription.subscription.monthlyPrice,
              billingCycle: subscription.billingCycle,
              cardDetails: subscription.paymentDetails?.cardDetails,
            });
  
            if (!renewalResult.success) {
              await store.dispatch(
                subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
                  status: 'expired'
                })
              );
              await this.applyFreePlan();
            }
          } else {
            await store.dispatch(
              subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
                status: 'expired'
              })
            );
            await this.applyFreePlan();
          }
        }
        // Check if subscription is about to expire
        else if (now > warningDate && subscription.status === 'active') {
          if (subscription.autoRenew && subscription.paymentMethod === 'card') {
            await createNotification(
              store.dispatch,
              'Your subscription will be automatically renewed in 3 days.',
              'info'
            );
          } else {
            await createNotification(
              store.dispatch,
              'Your subscription will expire in 3 days. Please renew to avoid service interruption.',
              'alert'
            );
          }
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

        // Force refetch current subscription
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

    // Run initial check immediately
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