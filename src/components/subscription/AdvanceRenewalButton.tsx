import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdvanceSubscribeMutation, useCancelAdvanceRenewalMutation } from '../../store/services/subscriptionService';
import PaymentModal from '../payment/PaymentModal';

interface AdvanceRenewalButtonProps {
  subscription: any;
  hasAdvanceRenewal: boolean;
  onSuccess?: () => void;
}

const AdvanceRenewalButton: React.FC<AdvanceRenewalButtonProps> = ({
  subscription,
  hasAdvanceRenewal,
  onSuccess
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [advanceSubscribe] = useAdvanceSubscribeMutation();
  const [cancelAdvanceRenewal] = useCancelAdvanceRenewalMutation();

  const handleAdvanceRenewal = async (
    subscriptionId: string,
    billingCycle: 'monthly' | 'yearly',
    paymentDetails: any
  ) => {
    try {
      await advanceSubscribe({
        subscriptionId,
        billingCycle,
        paymentMethod: paymentDetails.paymentMethod,
        paymentDetails: {
          paymentId: paymentDetails.paymentId,
          amount: paymentDetails.amount,
          status: paymentDetails.status,
          cardDetails: paymentDetails.cardDetails
        }
      }).unwrap();
      
      toast.success('Advance renewal scheduled successfully');
      setShowPaymentModal(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to schedule advance renewal');
    }
  };

  const handleCancelAdvanceRenewal = async () => {
    if (window.confirm('Are you sure you want to cancel your advance renewal?')) {
      try {
        await cancelAdvanceRenewal().unwrap();
        toast.success('Advance renewal cancelled successfully');
        if (onSuccess) onSuccess();
      } catch (error) {
        toast.error('Failed to cancel advance renewal');
      }
    }
  };

  if (hasAdvanceRenewal) {
    return (
      <button
        onClick={handleCancelAdvanceRenewal}
        className="inline-flex items-center px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
      >
        Cancel Advance Renewal
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowPaymentModal(true)}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
      >
        <Clock className="h-4 w-4 mr-2" />
        Renew in Advance
      </button>

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          subscriptionId={subscription._id}
          amount={subscription.billingCycle === 'yearly' 
            ? subscription.yearlyPrice 
            : subscription.monthlyPrice}
          onSuccess={(paymentDetails) => 
            handleAdvanceRenewal(
              subscription._id,
              subscription.billingCycle,
              paymentDetails
            )
          }
          billingCycle={subscription.billingCycle}
        />
      )}
    </>
  );
};

export default AdvanceRenewalButton;