import { addDays, format } from 'date-fns';
import { store } from '../../store';
import { subscriptionApi } from '../../store/services/subscriptionService';
import { createNotification } from '../notification';
import { SUBSCRIPTION_FEATURES } from './subscriptionFeatures';
import { createCustomer, createSubscriptionPlan, createSubscription, getSubscriptionStatus } from '../xendit';

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
      paymentMethod: subscription.paymentMethod,
      xenditSubscriptionId: subscription.paymentDetails?.xenditSubscriptionId
    };
  }

  private async handleAutoRenewal(subscription: any) {
    try {
      // Only attempt auto-renewal for credit card subscriptions
      if (subscription.paymentMethod !== 'card' || !subscription.autoRenew) {
        return false;
      }

      const cardDetails = subscription.paymentDetails?.cardDetails;
      if (!cardDetails) {
        throw new Error('No card details found');
      }

      // Create or get customer
      const customer = await createCustomer(
        subscription.user.name,
        subscription.user.email
      );

      // Create subscription plan
      const planAmount = subscription.billingCycle === 'yearly' 
        ? subscription.subscription.yearlyPrice 
        : subscription.subscription.monthlyPrice;

      const plan = await createSubscriptionPlan(
        subscription.subscription.name,
        planAmount,
        subscription.billingCycle === 'yearly' ? 'year' : 'month'
      );

      // Create Xendit subscription
      const xenditSubscription = await createSubscription(
        plan.id,
        customer.id,
        subscription.paymentDetails.cardToken
      );

      // Update subscription with Xendit subscription ID
      await store.dispatch(
        subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
          status: 'active',
          paymentDetails: {
            ...subscription.paymentDetails,
            xenditSubscriptionId: xenditSubscription.id
          }
        })
      );

      // Calculate new end date based on billing cycle
      const newEndDate = new Date();
      if (subscription.billingCycle === 'yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }

      // Update subscription dates
      await store.dispatch(
        subscriptionApi.endpoints.subscribe.initiate({
          subscriptionId: subscription.subscription._id,
          paymentMethod: 'card',
          billingCycle: subscription.billingCycle,
          autoRenew: true,
          startDate: new Date().toISOString(),
          endDate: newEndDate.toISOString(),
          paymentDetails: {
            ...subscription.paymentDetails,
            xenditSubscriptionId: xenditSubscription.id,
            status: 'active'
          }
        })
      ).unwrap();

      await createNotification(
        store.dispatch,
        'Your subscription has been automatically renewed.',
        'system'
      );

      return true;
    } catch (error) {
      console.error('Auto-renewal failed:', error);
      return false;
    }
  }

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

      // Check Xendit subscription status if exists
      if (details.xenditSubscriptionId) {
        const xenditStatus = await getSubscriptionStatus(details.xenditSubscriptionId);
        
        if (xenditStatus.status === 'ACTIVE') {
          // Update local subscription status if needed
          if (subscription.status !== 'active') {
            await store.dispatch(
              subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
                status: 'active'
              })
            );
          }
          return;
        }
      }

      // Handle near expiration warning
      if (now >= warningDate && now < endDate && subscription.status === 'active') {
        const message = subscription.autoRenew
          ? `Your subscription will be automatically renewed on ${format(endDate, 'MMM dd, yyyy')}.`
          : `Your subscription will expire on ${format(endDate, 'MMM dd, yyyy')}. Please renew to avoid service interruption.`;
        
        await createNotification(
          store.dispatch,
          message,
          subscription.autoRenew ? 'info' : 'alert'
        );
      }

      // Handle expired subscription
      if (now > endDate && subscription.status !== 'expired') {
        // Attempt auto-renewal for credit card subscriptions
        const renewalSuccess = await this.handleAutoRenewal(subscription);

        if (!renewalSuccess) {
          // If auto-renewal fails or isn't available, switch to free plan
          await store.dispatch(
            subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
              status: 'expired'
            })
          );
          await this.applyFreePlan();
          await createNotification(
            store.dispatch,
            'Your subscription has expired. You have been moved to the free plan.',
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