import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '../../store/services/subscriptionService';
import { subscriptionManager } from '../../utils/subscription/subscriptionManager';

const SubscriptionExpiredBanner = () => {
  const { data: subscription } = useGetCurrentSubscriptionQuery();

  if (!subscription) return null;

  // Get subscription details using SubscriptionManager
  const { isExpired, isNearExpiration } = subscriptionManager.getSubscriptionDetails(subscription);

  // If the subscription is neither expired nor near expiration, return null
  if (!isExpired && !isNearExpiration) return null;

  return (
    <div className={`p-4 ${isExpired ? 'bg-red-50' : 'bg-yellow-50'} border-l-4 ${isExpired ? 'border-red-400' : 'border-yellow-400'}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${isExpired ? 'text-red-400' : 'text-yellow-400'}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
            {isExpired ? (
              'Your subscription has expired. Some features are now limited.'
            ) : (
              'Your subscription will expire soon.'
            )}
            {' '}
            <Link
              to="/subscription"
              className="font-medium underline hover:text-primary"
            >
              Renew now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredBanner;