import React from 'react';
import { CreditCard, Smartphone } from 'lucide-react';
import { PaymentMethod } from './types';

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ onSelect, onClose }) => {
  const paymentMethods = [
    { id: 'card' as PaymentMethod, name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'gcash' as PaymentMethod, name: 'GCash', icon: Smartphone },
    { id: 'grab_pay' as PaymentMethod, name: 'GrabPay', icon: Smartphone },
    { id: 'maya' as PaymentMethod, name: 'Maya', icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {paymentMethods.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="p-6 border rounded-lg hover:border-primary hover:bg-gray-50 flex flex-col items-center gap-2 transition-all"
          >
            <Icon className="h-8 w-8 text-primary" />
            <span className="font-medium text-gray-900">{name}</span>
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        className="w-full py-2 text-gray-600 hover:text-gray-900"
      >
        Cancel
      </button>
    </div>
  );
};

export default PaymentMethodSelector;