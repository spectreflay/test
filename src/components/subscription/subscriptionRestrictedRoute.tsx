import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '../../store/services/subscriptionService';
import { canAccessFeatureWithSubscription, getSubscriptionStatus } from '../../utils/subscription/subscriptionRestrictions';
import { subscriptionManager } from '../../utils/subscription/subscriptionManager';

interface SubscriptionRestrictedRouteProps {
  children: React.ReactNode;
  requiredFeature?: string;
}

const SubscriptionRestrictedRoute: React.FC<SubscriptionRestrictedRouteProps> = ({
  children,
  requiredFeature
}) => {
  const { data: subscription } = useGetCurrentSubscriptionQuery();
  const location = useLocation();

  // Get subscription status using SubscriptionManager
  const subscriptionStatus = subscription ? subscriptionManager.getSubscriptionDetails(subscription) : null;

  // If no subscription status, redirect to subscription page
  if (!subscriptionStatus || subscriptionStatus.isExpired) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  // If a specific feature is required, check access
  if (requiredFeature && !canAccessFeatureWithSubscription(subscription, requiredFeature)) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SubscriptionRestrictedRoute;