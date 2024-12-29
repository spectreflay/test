import React, { useState } from "react";
import { X, CreditCard, AlertCircle } from 'lucide-react';
import PaymentSummary from "./PaymentSummary";
import { createInvoice, createCustomer, createSubscriptionPlan, createPaymentMethodFromInvoice, createSubscription, getInvoiceStatus, getSubscriptionDetails } from "../../utils/xendit";
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
  const [subscribe] = useSubscribeMutation();
  const isDevelopment = import.meta.env.MODE === 'development';
  const user = useSelector((state: RootState) => state.auth.user);

  const handleInitiatePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create customer in Xendit
      const customer = await createCustomer(
        user?.name || '',
        user?.email || ''
      );
      console.log('Customer created:', customer);

      // Create initial invoice
      const invoice = await createInvoice(
        amount,
        `Subscription Payment - ${subscriptionId}`,
        customer.id
      );
      console.log('Invoice created:', invoice);

      // Open Xendit payment page in a new window
      const paymentWindow = window.open(invoice.invoice_url, 'xenditPayment', 'width=600,height=600');

      // Start polling for payment status
      const pollInterval = setInterval(async () => {
        try {
          const status = await getInvoiceStatus(invoice.id);
          console.log('Invoice status:', status);
          
          if (status.status === 'PAID') {
            clearInterval(pollInterval);
            if (paymentWindow) {
              paymentWindow.close();
            }

            // Create payment method from successful invoice
            let paymentMethod;
            try {
              paymentMethod = await createPaymentMethodFromInvoice(invoice.id, customer.id);
              console.log('Payment method created:', paymentMethod);
            } catch (error) {
              console.error('Error creating payment method:', error);
              toast.error('Error creating payment method. Please try again or contact support.');
              setIsProcessing(false);
              return;
            }

            // Create subscription plan
            const plan = await createSubscriptionPlan(
              subscriptionId,
              amount,
              billingCycle
            );
            console.log('Subscription plan created:', plan);

            // Create subscription with the payment method
            const xenditSubscription = await createSubscription(
              plan.id,
              customer.id,
              paymentMethod.id
            );
            console.log('Xendit subscription created:', xenditSubscription);

            // Get subscription details
            const subscriptionDetails = await getSubscriptionDetails(xenditSubscription.id);
            console.log('Subscription details:', subscriptionDetails);

            // Update subscription with payment details
            await subscribe({
              subscriptionId,
              paymentMethod: status.payment_method,
              billingCycle,
              paymentDetails: {
                paymentId: invoice.id,
                amount,
                status: 'completed',
                xenditSubscriptionId: xenditSubscription.id,
                customerId: customer.id,
                planId: plan.id,
                paymentMethodId: paymentMethod.id,
                nextBillingDate: subscriptionDetails.next_payment_date,
                cardInfo: paymentMethod.card ? {
                  last4: paymentMethod.card.card_number.slice(-4),
                  brand: paymentMethod.card.card_information.network,
                  type: paymentMethod.card.card_information.type,
                  bank: paymentMethod.card.card_information.issuer
                } : undefined
              }
            }).unwrap();

            setIsProcessing(false);
            toast.success('Payment successful!');
            onSuccess();
          } else if (status.status === 'EXPIRED') {
            clearInterval(pollInterval);
            if (paymentWindow) {
              paymentWindow.close();
            }
            toast.error('Payment session expired');
            setIsProcessing(false);
          }
        } catch (error) {
          console.error('Error processing payment:', error);
          clearInterval(pollInterval);
          if (paymentWindow) {
            paymentWindow.close();
          }
          toast.error(`Error processing payment: ${error.message}`);
          setIsProcessing(false);
        }
      }, 3000); // Check every 3 seconds

      // Cleanup interval if modal is closed
      return () => clearInterval(pollInterval);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Failed to initiate payment: ${error.message}`);
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
                      You will be redirected to Xendit's test payment page. Use test card details or test e-wallet credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <CreditCard className="h-12 w-12 text-primary mx-auto" />
              <p className="text-gray-600">
                You will be redirected to Xendit's secure payment page to complete your payment.
              </p>
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
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

