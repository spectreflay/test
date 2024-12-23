import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '../../store/services/subscriptionService';
import { isSubscriptionExpired, isNearExpiration } from '../../utils/subscription/subscriptionStatus';

const SubscriptionExpiredBanner = () => {
  const { data: subscription } = useGetCurrentSubscriptionQuery();

  if (!subscription) return null;

  const expired = isSubscriptionExpired(subscription.endDate);
  const nearExpiry = isNearExpiration(subscription.endDate);

  if (!expired && !nearExpiry) return null;

  return (
    <div className={`p-4 ${expired ? 'bg-red-50' : 'bg-yellow-50'} border-l-4 ${expired ? 'border-red-400' : 'border-yellow-400'}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-5 w-5 ${expired ? 'text-red-400' : 'text-yellow-400'}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm ${expired ? 'text-red-800' : 'text-yellow-800'}`}>
            {expired ? (
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