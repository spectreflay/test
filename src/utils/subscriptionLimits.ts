import { toast } from "react-hot-toast";
import { SUBSCRIPTION_FEATURES } from "./subscriptionFeatures";
import { UserSubscription } from "../store/services/subscriptionService";

export type FeatureLimit = {
  name: string;
  limit: number;
  current: number;
  isExceeded: boolean;
};

export const checkSubscriptionLimit = (
  subscription: UserSubscription | undefined,
  feature: keyof typeof SUBSCRIPTION_FEATURES.PREMIUM,
  currentCount: number
): boolean => {
  if (!subscription || subscription.status !== "active") return false;

  const plan = subscription.subscription.name.toUpperCase() as keyof typeof SUBSCRIPTION_FEATURES;
  const limit = SUBSCRIPTION_FEATURES[plan][feature];

  if (typeof limit !== "number") {
    throw new Error(`Invalid limit type for feature '${feature}'`);
  }

  return currentCount < limit;
};

export const getFeatureLimits = (
  subscription: UserSubscription | undefined,
  counts: {
    products?: number;
    staff?: number;
    stores?: number;
  }
): FeatureLimit[] => {
  if (!subscription || subscription.status !== "active") {
    return [];
  }

  const plan = subscription.subscription.name.toUpperCase() as keyof typeof SUBSCRIPTION_FEATURES;
  const limits = SUBSCRIPTION_FEATURES[plan];

  return [
    {
      name: "Products",
      limit: limits.maxProducts,
      current: counts.products || 0,
      isExceeded: (counts.products || 0) >= limits.maxProducts
    },
    {
      name: "Staff Members",
      limit: limits.maxStaff,
      current: counts.staff || 0,
      isExceeded: (counts.staff || 0) >= limits.maxStaff
    },
    {
      name: "Stores",
      limit: limits.maxStores,
      current: counts.stores || 0,
      isExceeded: (counts.stores || 0) >= limits.maxStores
    }
  ];
};

export const showUpgradePrompt = (feature: string) => {
  toast.error(
    `You've reached the limit for ${feature}. Upgrade your plan to add more.`,
    {
      duration: 5000,
    }
  );
};

export const getSubscriptionTier = (subscription: UserSubscription | undefined): 'free' | 'basic' | 'premium' | null => {
  if (!subscription || subscription.status !== "active") {
    return null;
  }
  return subscription.subscription.name;
};

export const canAccessFeature = (
  subscription: UserSubscription | undefined,
  feature: string
): boolean => {
  if (!subscription || subscription.status !== "active") {
    return false;
  }

  const plan = subscription.subscription.name.toUpperCase() as keyof typeof SUBSCRIPTION_FEATURES;
  return SUBSCRIPTION_FEATURES[plan].features.includes(feature);
};

export const getRemainingItems = (
  subscription: UserSubscription | undefined,
  feature: keyof typeof SUBSCRIPTION_FEATURES.PREMIUM,
  currentCount: number
): number => {
  if (!subscription || subscription.status !== "active") {
    return 0;
  }

  const plan = subscription.subscription.name.toUpperCase() as keyof typeof SUBSCRIPTION_FEATURES;
  const limit = SUBSCRIPTION_FEATURES[plan][feature];

  if (typeof limit !== "number" || limit === Infinity) {
    return Infinity;
  }

  return Math.max(0, limit - currentCount);
};

export const getUsagePercentage = (
  subscription: UserSubscription | undefined,
  feature: keyof typeof SUBSCRIPTION_FEATURES.PREMIUM,
  currentCount: number
): number => {
  if (!subscription || subscription.status !== "active") {
    return 100;
  }

  const plan = subscription.subscription.name.toUpperCase() as keyof typeof SUBSCRIPTION_FEATURES;
  const limit = SUBSCRIPTION_FEATURES[plan][feature];

  if (typeof limit !== "number" || limit === Infinity) {
    return 0;
  }

  return Math.min(100, (currentCount / limit) * 100);
};

export const shouldShowUpgradePrompt = (
  subscription: UserSubscription | undefined,
  feature: keyof typeof SUBSCRIPTION_FEATURES.PREMIUM,
  currentCount: number,
  threshold: number = 0.9
): boolean => {
  if (!subscription || subscription.status !== "active") {
    return true;
  }

  const usagePercentage = getUsagePercentage(subscription, feature, currentCount);
  return usagePercentage >= threshold * 100;
};