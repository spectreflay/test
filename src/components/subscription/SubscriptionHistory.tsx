import React from 'react';
import { format } from 'date-fns';
import { History, X } from 'lucide-react';

interface SubscriptionHistoryProps {
  history: Array<{
    _id: string;
    user: string;
    subscription: {
      name: string;
      monthlyPrice: number;
      yearlyPrice: number;
    };
    action: 'subscribed' | 'cancelled' | 'billing_cycle_changed';
    reason?: string;
    billingCycle: 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    paymentMethod: string;
    paymentDetails?: {
      paymentId?: string;
      amount?: number;
      status?: string;
    };
    createdAt: string;
  }>;
  onClose: () => void;
}

const SubscriptionHistory: React.FC<SubscriptionHistoryProps> = ({ history, onClose }) => {
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'grab_pay':
        return 'GrabPay';
      case 'maya':
        return 'Maya';
      case 'gcash':
        return 'GCash';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Subscription History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.subscription.name}
                    </span>
                    <p className="text-xs text-gray-500">
                      ${item.billingCycle === 'yearly' 
                        ? item.subscription.yearlyPrice 
                        : item.subscription.monthlyPrice}/{item.billingCycle}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {item.action.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    {item.reason && (
                      <p className="text-xs text-gray-500">{item.reason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(item.startDate), 'MMM dd, yyyy')} -
                      <br />
                      {format(new Date(item.endDate), 'MMM dd, yyyy')}
                    </div>
                    <span className={`text-xs ${item.autoRenew ? 'text-green-600' : 'text-gray-500'}`}>
                      {item.autoRenew ? 'Auto-renew enabled' : 'Auto-renew disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatPaymentMethod(item.paymentMethod)}
                    </span>
                    {item.paymentDetails?.amount && (
                      <p className="text-xs text-gray-500">
                        ${item.paymentDetails.amount.toFixed(2)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getStatusBadgeColor(item.paymentDetails?.status)
                    }`}>
                      {item.paymentDetails?.status || 'completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {history.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No subscription history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionHistory;