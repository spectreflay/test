import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeatureLimit } from '../../utils/subscription/subscriptionLimits';

interface SubscriptionLimitAlertProps {
  featureLimit: FeatureLimit;
}

const SubscriptionLimitAlert: React.FC<SubscriptionLimitAlertProps> = ({ featureLimit }) => {
  const percentage = (featureLimit.current / featureLimit.limit) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isCritical = percentage >= 100;

  if (percentage < 80) return null;

  return (
    <div
      className={`rounded-lg p-4 ${
        isCritical ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
      }`}
    >
      <div className="flex items-center">
        <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-400' : 'text-yellow-400'}`} />
        <div className="ml-3">
          <h3 className="text-sm font-medium">
            {isCritical
              ? `${featureLimit.name} limit reached`
              : `${featureLimit.name} limit almost reached`}
          </h3>
          <div className="mt-2 text-sm">
            <p>
              {`Using ${featureLimit.current} of ${featureLimit.limit} available ${featureLimit.name.toLowerCase()}`}
            </p>
          </div>
          <div className="mt-4">
            <div className="sm:flex sm:items-center">
              <Link
                to="/subscription"
                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                  isCritical
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-yellow-600 text-white hover:bg-yellow-500'
                }`}
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLimitAlert;