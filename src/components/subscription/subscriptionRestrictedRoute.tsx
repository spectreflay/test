import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '../../store/services/subscriptionService';
import { isSubscriptionExpired } from '../../utils/subscription/subscriptionStatus';
import { canAccessFeatureWithSubscription } from '../../utils/subscription/subscriptionRestrictions';

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

  // If no feature is required, just check if subscription is active
  if (!requiredFeature) {
    if (!subscription || isSubscriptionExpired(subscription.endDate)) {
      return <Navigate to="/subscription" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // Check if user can access the specific feature
  if (!canAccessFeatureWithSubscription(subscription, requiredFeature)) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SubscriptionRestrictedRoute;
