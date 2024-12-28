import React, { useState } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createCardToken, createCardCharge } from '../../utils/xendit';
import { useSubscribeMutation } from '../../store/services/subscriptionService';

interface CardPaymentFormProps {
  amount: number;
  subscriptionId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack: () => void;
}

interface CardFormData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
}

const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  amount,
  subscriptionId,
  billingCycle,
  onSuccess,
  onBack,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscribe] = useSubscribeMutation();
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    cardHolder: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    // Format expiry date
    else if (name === 'expMonth') {
      formattedValue = value.replace(/\D/g, '').slice(0, 2);
    }
    else if (name === 'expYear') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    // Format CVC
    else if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create card token
      const cardToken = await createCardToken({
        card_number: formData.cardNumber.replace(/\s/g, ''),
        exp_month: parseInt(formData.expMonth),
        exp_year: parseInt(formData.expYear),
        cvc: formData.cvc
      });

      // Create charge
      const charge = await createCardCharge(
        cardToken.id,
        amount,
        `Subscription Payment - ${subscriptionId}`
      );

      if (charge.status === 'CAPTURED') {
        // Store card details for auto-renewal (excluding CVC)
        const cardDetails = {
          cardNumber: formData.cardNumber.slice(-4),
          expMonth: parseInt(formData.expMonth),
          expYear: parseInt(formData.expYear),
          cardHolder: formData.cardHolder
        };

        // Update subscription with payment details
        await subscribe({
          subscriptionId,
          paymentMethod: 'card',
          billingCycle,
          autoRenew: true,
          paymentDetails: {
            paymentId: charge.id,
            amount,
            status: 'completed',
            cardDetails
          }
        }).unwrap();

        toast.success('Payment successful!');
        onSuccess();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      onError(error.message || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold">Card Payment</h2>
      </div>

      <div className="text-2xl font-bold mb-6">${amount.toFixed(2)}</div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Card Holder Name
          </label>
          <input
            type="text"
            name="cardHolder"
            value={formData.cardHolder}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Card Number
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="4111 1111 1111 1111"
              maxLength={19}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Month
            </label>
            <input
              type="text"
              name="expMonth"
              value={formData.expMonth}
              onChange={handleInputChange}
              placeholder="MM"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="text"
              name="expYear"
              value={formData.expYear}
              onChange={handleInputChange}
              placeholder="YYYY"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              CVC
            </label>
            <input
              type="text"
              name="cvc"
              value={formData.cvc}
              onChange={handleInputChange}
              placeholder="123"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default CardPaymentForm;