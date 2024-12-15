import React, { useState } from 'react';
import { X, CreditCard, Smartphone } from 'lucide-react';
import PaymentMethodCard from '../payment/PaymentMethodCard';
import PaymentSummary from '../payment/PaymentSummary';
import PaymentSteps from '../payment/PaymentSteps';
import CardPaymentForm from '../payment/CardPaymentForm';
import EWalletPayment from '../payment/EwalletPayment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  amount: number;
  onSuccess: () => void;
}

const PAYMENT_STEPS = ['Select Method', 'Payment Details', 'Confirmation'];

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  amount,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: CreditCard,
    },
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Pay with your GCash wallet',
      icon: Smartphone,
    },
    {
      id: 'grab_pay',
      name: 'GrabPay',
      description: 'Pay with your GrabPay wallet',
      icon: Smartphone,
    },
    {
      id: 'maya',
      name: 'Maya',
      description: 'Pay with your Maya wallet',
      icon: Smartphone,
    },
  ];

  const handlePaymentSuccess = async (paymentId?: string) => {
    setCurrentStep(2);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Show success state briefly
    onSuccess();
  };

  const handlePaymentError = (error: string) => {
    setSelectedMethod(null);
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <PaymentSteps currentStep={currentStep} steps={PAYMENT_STEPS} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {currentStep === 0 && (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      icon={method.icon}
                      name={method.name}
                      description={method.description}
                      selected={selectedMethod === method.id}
                      onClick={() => {
                        setSelectedMethod(method.id);
                        setCurrentStep(1);
                      }}
                    />
                  ))}
                </div>
              )}

              {currentStep === 1 && selectedMethod === 'card' && (
                <CardPaymentForm
                  amount={amount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}

              {currentStep === 1 && ['gcash', 'grab_pay', 'maya'].includes(selectedMethod || '') && (
                <EWalletPayment
                  type={selectedMethod as 'gcash' | 'grab_pay' | 'maya'}
                  amount={amount}
                  subscriptionId={subscriptionId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
            </div>

            <div>
              <PaymentSummary
                planName={subscriptionId}
                amount={amount}
                billingCycle="monthly"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;