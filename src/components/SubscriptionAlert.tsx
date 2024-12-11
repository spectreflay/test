import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '../store/services/subscriptionService';

const SubscriptionAlert = () => {
  const { data: subscription } = useGetCurrentSubscriptionQuery();

  if (!subscription || subscription.status === 'active') {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            {subscription.status === 'expired'
              ? 'Your subscription has expired. Some features may be limited.'
              : 'Your subscription will expire soon.'}
            {' '}
            <Link
              to="/subscription"
              className="font-medium underline text-yellow-700 hover:text-yellow-600"
            >
              Upgrade your plan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAlert;