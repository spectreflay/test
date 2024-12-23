import { addDays, addMinutes } from 'date-fns';
import { store } from '../../store';
import { subscriptionApi, UserSubscription } from '../../store/services/subscriptionService';
import { createNotification } from '../notification';
import { SUBSCRIPTION_FEATURES } from './subscriptionFeatures';
import { handleAutoRenewal } from './subscriptionRenewal';
import { createPaymentIntent, createPaymentMethod, getPaymentIntentStatus } from '../paymongo';
import { toast } from 'react-hot-toast';

interface RenewalDetails {
    subscriptionId: string;
    amount: number;
    billingCycle: 'monthly' | 'yearly';
    paymentDetails?: {
      paymentMethodId?: string;  // Store the PayMongo payment method ID
      cardDetails?: {
        cardNumber: string;
        expMonth: number;
        expYear: number;
        cvc: string;
      };
    };
  }

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
          if (subscription.autoRenew && subscription.paymentMethod === 'card') {
            // Attempt auto-renewal
            const renewalResult = await handleAutoRenewal({
              subscriptionId: subscription.subscription._id,
              amount: subscription.billingCycle === 'yearly' 
                ? subscription.subscription.yearlyPrice 
                : subscription.subscription.monthlyPrice,
              billingCycle: subscription.billingCycle,
              cardDetails: subscription.paymentDetails?.cardDetails,
            });
  
            if (!renewalResult.success) {
              // Update subscription status to expired if renewal fails
              await store.dispatch(
                subscriptionApi.endpoints.updateSubscriptionStatus.initiate({
                  status: 'expired'
                })
              );
              await this.applyFreePlan();
            }
          } else {
            // Update subscription status to expired
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