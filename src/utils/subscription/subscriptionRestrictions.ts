import { UserSubscription } from "../../store/services/subscriptionService";
import { isSubscriptionExpired } from "./subscriptionStatus";

// Define feature access based on subscription status
export const canAccessFeatureWithSubscription = (
  subscription: UserSubscription | undefined,
  feature: string
): boolean => {
  // If no subscription exists, deny access
  if (!subscription) return false;

  // If subscription is expired, only allow access to basic features
  if (isSubscriptionExpired(subscription.endDate)) {
    const basicFeatures = ['basic_reports', 'basic_inventory'];
    return basicFeatures.includes(feature);
  }

  // If subscription is active, check if feature is included
  return subscription.subscription.features.includes(feature);
};

// Check if user has exceeded their subscription limits
export const hasExceededLimit = (
  subscription: UserSubscription | undefined,
  limitType: 'products' | 'staff' | 'stores',
  currentCount: number
): boolean => {
  if (!subscription) return true;

  // If subscription is expired, use free tier limits
  if (isSubscriptionExpired(subscription.endDate)) {
    const freeLimits = {
      products: 10,
      staff: 2,
      stores: 1
    };
    return currentCount >= freeLimits[limitType];
  }

  const limits = {
    products: subscription.subscription.maxProducts,
    staff: subscription.subscription.maxStaff,
    stores: subscription.subscription.maxStores
  };

  return currentCount >= limits[limitType];
};

// Get current subscription tier and status
export const getSubscriptionStatus = (
  subscription: UserSubscription | undefined
): { tier: string; isExpired: boolean; expiryDate: string | null } => {
  if (!subscription) {
    return { tier: 'none', isExpired: true, expiryDate: null };
  }

  return {
    tier: subscription.subscription.name,
    isExpired: isSubscriptionExpired(subscription.endDate),
    expiryDate: subscription.endDate || null
  };
};