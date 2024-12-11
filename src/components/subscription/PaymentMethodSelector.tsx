import React from 'react';
import { CreditCard, Smartphone } from 'lucide-react';

interface PaymentMethodSelectorProps {
  onSelect: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ onSelect }) => {
  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'gcash', name: 'GCash', icon: Smartphone },
    { id: 'grab_pay', name: 'GrabPay', icon: Smartphone },
    { id: 'paymaya', name: 'Maya', icon: Smartphone },
  ];

  return (
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
  );
};

export default PaymentMethodSelector;