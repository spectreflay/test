import React from 'react';
import { Check } from 'lucide-react';

interface PaymentStepsProps {
  currentStep: number;
  steps: string[];
}

const PaymentSteps: React.FC<PaymentStepsProps> = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          {index > 0 && (
            <div className={`h-1 w-16 mx-2 ${
              index <= currentStep ? 'bg-primary' : 'bg-gray-200'
            }`} />
          )}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index < currentStep
                ? 'bg-primary text-white'
                : index === currentStep
                ? 'bg-primary/10 text-primary border-2 border-primary'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`text-sm mt-2 ${
              index <= currentStep ? 'text-primary' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default PaymentSteps;