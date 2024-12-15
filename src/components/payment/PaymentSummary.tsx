import React from 'react';
import { CreditCard, Shield } from 'lucide-react';

interface PaymentSummaryProps {
  planName: string;
  amount: number;
  billingCycle: string;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ planName, amount, billingCycle }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
      <h3 className="font-medium text-gray-900">Payment Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Plan</span>
          <span className="font-medium text-gray-900 capitalize">{planName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Billing Cycle</span>
          <span className="font-medium text-gray-900 capitalize">{billingCycle}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-medium text-gray-900">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm text-gray-500 bg-white p-3 rounded-lg">
        <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        <p>Your payment information is encrypted and secure. We never store your card details.</p>
      </div>
    </div>
  );
};

export default PaymentSummary;