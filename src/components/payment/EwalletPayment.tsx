import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createInvoice, getInvoiceStatus } from '../../utils/xendit';
import { useSubscribeMutation } from '../../store/services/subscriptionService';

interface EWalletPaymentProps {
  type: 'GCASH' | 'GRABPAY' | 'PAYMAYA';
  amount: number;
  subscriptionId: string;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack: () => void;
}

const EWalletPayment: React.FC<EWalletPaymentProps> = ({
  type,
  amount,
  subscriptionId,
  billingCycle,
  onSuccess,
  onError,
  onBack,
}) => {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const isDevelopment = import.meta.env.MODE === 'development';
  const [subscribe] = useSubscribeMutation();

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const invoice = await createInvoice(amount, `Subscription Payment - ${subscriptionId}`);
        setInvoiceData(invoice);
        
        // Start polling for payment status
        const interval = setInterval(async () => {
          try {
            const status = await getInvoiceStatus(invoice.id);
            if (status.status === 'PAID') {
              clearInterval(interval);
              
              // Update subscription with payment details
              await subscribe({
                subscriptionId,
                paymentMethod: type.toLowerCase(),
                billingCycle,
                paymentDetails: {
                  paymentId: invoice.id,
                  amount,
                  status: 'completed'
                }
              }).unwrap();

              toast.success('Payment successful!');
              onSuccess();
            } else if (status.status === 'EXPIRED' || status.status === 'FAILED') {
              clearInterval(interval);
              onError('Payment failed or expired');
            }
          } catch (error) {
            console.error('Error checking payment status:', error);
          }
        }, 3000);

        setPollInterval(interval);

        // Open the checkout URL in a new window
        if (invoice.invoice_url) {
          window.open(invoice.invoice_url, '_blank');
        }
      } catch (error: any) {
        onError(error.message || 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [type, amount, subscriptionId, billingCycle, onSuccess, onError, subscribe]);

  if (isLoading) {
    return (  
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Initializing payment...</p>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to initialize payment. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold capitalize">{type === 'PAYMAYA' ? 'Maya' : type} Payment</h2>
      </div>

      {isDevelopment && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-blue-700 font-medium">Development Mode</p>
              <p className="text-sm text-blue-600 mt-1">
                A new window will open with Xendit's test payment page. Complete the payment there and return to this window.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg inline-block">
          <QRCodeSVG 
            value={invoiceData.invoice_url} 
            size={200} 
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium">Amount: ₱{amount.toFixed(2)}</p>
          <p className="text-gray-600">
            Scan the QR code or click the button below to complete your payment
          </p>
        </div>

        <button
          onClick={() => window.open(invoiceData.invoice_url, '_blank')}
          className="inline-block py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          Open Payment Page
        </button>

        <p className="text-sm text-gray-500">
          Keep this window open. Your subscription will automatically update once payment is complete.
        </p>
      </div>
    </div>
  );
};

export default EWalletPayment;