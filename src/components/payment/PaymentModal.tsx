import React, { useState } from "react";
import { X, CreditCard, AlertCircle } from 'lucide-react';
import PaymentSummary from "./PaymentSummary";
import { createCustomer, createSubscriptionPlan, createCardToken, createPaymentMethod, createSubscription, getSubscriptionDetails } from "../../utils/xendit";
import { useSubscribeMutation } from "../../store/services/subscriptionService";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  amount,
  billingCycle,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [subscribe] = useSubscribeMutation();
  const isDevelopment = import.meta.env.MODE === 'development';
  const user = useSelector((state: RootState) => state.auth.user);

  const handleInitiatePayment = async () => {
    try {
      setIsProcessing(true);
      
      // 1. Create customer in Xendit
      const customer = await createCustomer(
        user?.name || '',
        user?.email || ''
      );
      console.log('Customer created:', customer);

      // 2. Create subscription plan
      const plan = await createSubscriptionPlan(
        subscriptionId,
        amount,
        billingCycle
      );
      console.log('Subscription plan created:', plan);

      // 3. Tokenize card
      const token = await createCardToken({
        card_number: cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(expMonth),
        exp_year: parseInt(expYear),
        cvc: cvc
      });
      console.log('Card tokenized:', token);

      // 4. Create payment method
      const paymentMethod = await createPaymentMethod(
        customer.id,
        token.id,
        {
          card_information: {
            cardholder_name: cardHolder,
            expiry_month: expMonth,
            expiry_year: expYear
          }
        }
      );
      console.log('Payment method created:', paymentMethod);

      // 5. Create subscription
      const xenditSubscription = await createSubscription(
        plan.id,
        customer.id,
        paymentMethod.id
      );
      console.log('Xendit subscription created:', xenditSubscription);

      // 6. Get subscription details
      const subscriptionDetails = await getSubscriptionDetails(xenditSubscription.id);
      console.log('Subscription details:', subscriptionDetails);

      // 7. Update subscription with payment details
      await subscribe({
        subscriptionId,
        paymentMethod: 'card',
        billingCycle,
        paymentDetails: {
          paymentId: token.id,
          amount,
          status: 'completed',
          xenditSubscriptionId: xenditSubscription.id,
          customerId: customer.id,
          planId: plan.id,
          paymentMethodId: paymentMethod.id,
          nextBillingDate: subscriptionDetails.next_payment_date,
          cardInfo: {
            last4: cardNumber.slice(-4),
            expMonth,
            expYear,
            cardHolder
          }
        }
      }).unwrap();

      setIsProcessing(false);
      toast.success('Payment successful!');
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Failed to process payment: ${error.message}`);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {isDevelopment && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Development Mode</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Use test card: 4000000000001091<br />
                      Exp: 12/25, CVC: 123
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Month</label>
                  <input
                    type="text"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    placeholder="MM"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="text"
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    placeholder="YY"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CVC</label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Card Holder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <PaymentSummary
              planName={subscriptionId}
              amount={amount}
              billingCycle={billingCycle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;