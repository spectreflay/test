import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PaymentMethodCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  selected?: boolean;
  onClick: () => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  icon: Icon,
  name,
  description,
  selected,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-lg border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${selected ? 'bg-primary/10' : 'bg-gray-100'}`}>
          <Icon className={`h-6 w-6 ${selected ? 'text-primary' : 'text-gray-500'}`} />
        </div>
        <div className="text-left">
          <h3 className={`font-medium ${selected ? 'text-primary' : 'text-gray-900'}`}>
            {name}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default PaymentMethodCard;