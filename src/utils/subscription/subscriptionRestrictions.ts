import { UserSubscription } from "../../store/services/subscriptionService";
import { subscriptionManager } from "./subscriptionManager";

// Define feature access based on subscription status
export const canAccessFeatureWithSubscription = (
  subscription: UserSubscription | undefined,
  feature: string
): boolean => {
  // If no subscription exists, deny access
  if (!subscription) return false;

  // Get the current subscription details from the SubscriptionManager
  const { isExpired, features } = subscriptionManager.getSubscriptionDetails(subscription);

  // If subscription is expired, only allow access to basic features
  if (isExpired) {
    const basicFeatures = ['basic_reports', 'basic_inventory'];
    return basicFeatures.includes(feature);
  }

  // If subscription is active, check if feature is included
  return features.includes(feature);
};

// Check if user has exceeded their subscription limits
export const hasExceededLimit = (
  subscription: UserSubscription | undefined,
  limitType: 'products' | 'staff' | 'stores',
  currentCount: number
): boolean => {
  // If no subscription exists, assume limits are exceeded
  if (!subscription) return true;

  // Get the current subscription details from the SubscriptionManager
  const { isExpired, limits } = subscriptionManager.getSubscriptionDetails(subscription);

  // If subscription is expired, use free tier limits
  if (isExpired) {
    const freeLimits = {
      products: 10,
      staff: 2,
      stores: 1
    };
    return currentCount >= freeLimits[limitType];
  }

  // Check against the subscription limits
  return currentCount >= limits[limitType];
};

// Get current subscription tier and status
export const getSubscriptionStatus = (
  subscription: UserSubscription | undefined
): { tier: string; isExpired: boolean; expiryDate: string | null } => {
  // If no subscription exists, return default values
  if (!subscription) {
    return { tier: 'none', isExpired: true, expiryDate: null };
  }

  // Get the current subscription details from the SubscriptionManager
  const { tier, isExpired, expiryDate } = subscriptionManager.getSubscriptionDetails(subscription);

  return {
    tier,
    isExpired,
    expiryDate
  };
};