import React from 'react';
import { Check } from 'lucide-react';

interface BillingCycleToggleProps {
  cycle: 'monthly' | 'yearly';
  onChange: (cycle: 'monthly' | 'yearly') => void;
}

const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({ cycle, onChange }) => {
  return (
    <div className="flex flex-col items-center space-y-4 mb-8">
      <div className="text-lg font-medium text-gray-900">Billing Cycle</div>
      <div className="bg-gray-100 p-1 rounded-lg inline-flex">
        <button
          onClick={() => onChange('monthly')}
          className={`${
            cycle === 'monthly'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          } px-4 py-2 rounded-md text-sm font-medium transition-colors relative`}
        >
          Monthly
          {cycle === 'monthly' && (
            <span className="absolute -top-1 -right-1">
              <Check className="h-4 w-4 text-primary" />
            </span>
          )}
        </button>
        <button
          onClick={() => onChange('yearly')}
          className={`${
            cycle === 'yearly'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          } px-4 py-2 rounded-md text-sm font-medium transition-colors relative`}
        >
          Yearly
          <span className="ml-1 text-green-500 text-xs font-normal">Save 20%</span>
          {cycle === 'yearly' && (
            <span className="absolute -top-1 -right-1">
              <Check className="h-4 w-4 text-primary" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BillingCycleToggle;