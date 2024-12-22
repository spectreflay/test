import React from 'react';
import { format } from 'date-fns';
import { Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGetSubscriptionHistoryQuery } from '../store/services/subscriptionService';

const SubscriptionHistory = () => {
  const { data: history, isLoading } = useGetSubscriptionHistoryQuery();

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'subscribed':
        return 'Subscribed';
      case 'cancelled':
        return 'Cancelled';
      case 'billing_cycle_changed':
        return 'Changed Billing Cycle';
      default:
        return action;
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                Subscription History
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/subscription"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Subscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {history?.map((item: any) => (
                <li key={item._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {item.subscription.name.toUpperCase()} Plan
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {getActionLabel(item.action)}
                          {item.reason && ` - ${item.reason}`}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                        <p className="text-sm text-gray-500">
                          {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {item.billingCycle && (
                          <p className="mt-1 text-sm text-gray-500 capitalize">
                            {item.billingCycle} billing
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default SubscriptionHistory;