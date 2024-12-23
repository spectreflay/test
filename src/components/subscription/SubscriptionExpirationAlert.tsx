import React from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subscriptionManager } from '../../utils/subscription/subscriptionManager';
import { UserSubscription } from '../../store/services/subscriptionService'; // Import the UserSubscription type

interface SubscriptionExpirationAlertProps {
  subscription: UserSubscription; // Use the UserSubscription type directly
}

const SubscriptionExpirationAlert: React.FC<SubscriptionExpirationAlertProps> = ({ subscription }) => {
  // Ensure endDate is defined
  const endDate = subscription.endDate || ''; // Default to an empty string if undefined

  // Get subscription details using SubscriptionManager
  const { isExpired, isNearExpiration } = subscriptionManager.getSubscriptionDetails(subscription);

  const isEwallet = ['gcash', 'grab_pay', 'maya'].includes(subscription.paymentMethod);

  // If the subscription is neither expired nor near expiration, return null
  if (!isExpired && !isNearExpiration) return null;

  return (
    <div className={`p-4 rounded-lg ${isExpired ? 'bg-red-50' : 'bg-yellow-50'}`}>
      <div className="flex items-start">
        <AlertTriangle className={`h-5 w-5 ${isExpired ? 'text-red-400' : 'text-yellow-400'}`} />
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
            {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
          </h3>
          <div className="mt-2 text-sm">
            {isExpired ? (
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