// src/components/subscription/SubscriptionExpirationAlert.tsx
import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isSubscriptionExpired, isNearExpiration } from '../../utils/subscription/subscriptionStatus';

interface SubscriptionExpirationAlertProps {
  subscription: {
    endDate?: string;
    autoRenew: boolean;
    paymentMethod: string;
  };
}

const SubscriptionExpirationAlert: React.FC<SubscriptionExpirationAlertProps> = ({ subscription }) => {
  const expired = isSubscriptionExpired(subscription.endDate);
  const nearExpiration = isNearExpiration(subscription.endDate);
  const isEwallet = ['gcash', 'grab_pay', 'maya'].includes(subscription.paymentMethod);

  if (!expired && !nearExpiration) return null;

  return (
    <div className={`p-4 rounded-lg ${expired ? 'bg-red-50' : 'bg-yellow-50'}`}>
      <div className="flex items-start">
        <AlertTriangle className={`h-5 w-5 ${expired ? 'text-red-400' : 'text-yellow-400'}`} />
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${expired ? 'text-red-800' : 'text-yellow-800'}`}>
            {expired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
          </h3>
          <div className="mt-2 text-sm">
            {expired ? (
              isEwallet ? (
                <p>Your subscription has expired. Please manually renew your subscription.</p>
              ) : (
                subscription.autoRenew ? (
                  <p>Auto-renewal failed. Please update your payment method.</p>
                ) : (
                  <p>Your subscription has expired. Please renew to continue using premium features.</p>
                )
              )
            ) : (
              isEwallet ? (
                <p>Your subscription will expire soon. Please renew manually before expiration.</p>
              ) : (
                subscription.autoRenew ? (
                  <p>Your subscription will be automatically renewed.</p>
                ) : (
                  <p>Your subscription will expire soon. Enable auto-renewal or renew manually.</p>
                )
              )
            )}
          </div>
          <div className="mt-4">
            <Link
              to="/subscription"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isEwallet ? 'Renew Subscription' : 'Update Payment Method'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpirationAlert;
