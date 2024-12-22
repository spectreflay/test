import React, { useState, useEffect } from "react";
import { X, CreditCard, Smartphone, Check } from "lucide-react";
import PaymentMethodCard from "../payment/PaymentMethodCard";
import PaymentSummary from "../payment/PaymentSummary";
import PaymentSteps from "../payment/PaymentSteps";
import CardPaymentForm from "../payment/CardPaymentForm";
import EWalletPayment from "../payment/EwalletPayment";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
}

const PAYMENT_STEPS = ["Select Method", "Payment Details", "Confirmation"];
const REDIRECT_DELAY = 10; // 10 seconds countdown

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  amount,
  billingCycle,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 2) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShouldRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep]);

  useEffect(() => {
    if (shouldRedirect) {
      onSuccess();
    }
  }, [shouldRedirect, onSuccess]);

  const handlePaymentSuccess = async () => {
    setCurrentStep(2);
    setCountdown(REDIRECT_DELAY);
  };

  const handlePaymentError = (error: string) => {
    setSelectedMethod(null);
    setCurrentStep(0);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 1) {
        setSelectedMethod(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Complete Payment
            </h2>
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
                  <PaymentMethodCard
                    icon={CreditCard}
                    name="Credit/Debit Card"
                    description="Pay securely with your card"
                    selected={selectedMethod === "card"}
                    onClick={() => {
                      setSelectedMethod("card");
                      setCurrentStep(1);
                    }}
                  />
                  <PaymentMethodCard
                    icon={Smartphone}
                    name="GCash"
                    description="Pay with your GCash wallet"
                    selected={selectedMethod === "gcash"}
                    onClick={() => {
                      setSelectedMethod("gcash");
                      setCurrentStep(1);
                    }}
                  />
                  <PaymentMethodCard
                    icon={Smartphone}
                    name="GrabPay"
                    description="Pay with your GrabPay wallet"
                    selected={selectedMethod === "grab_pay"}
                    onClick={() => {
                      setSelectedMethod("grab_pay");
                      setCurrentStep(1);
                    }}
                  />
                  <PaymentMethodCard
                    icon={Smartphone}
                    name="Maya"
                    description="Pay with your Maya wallet"
                    selected={selectedMethod === "paymaya"}
                    onClick={() => {
                      setSelectedMethod("paymaya");
                      setCurrentStep(1);
                    }}
                  />
                </div>
              )}

              {currentStep === 1 && selectedMethod === "card" && (
                <CardPaymentForm
                  amount={amount}
                  subscriptionId={subscriptionId}
                  billingCycle={billingCycle}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onBack={handleBack}
                />
              )}

              {currentStep === 1 &&
                ["gcash", "grab_pay", "paymaya"].includes(
                  selectedMethod || ""
                ) && (
                  <EWalletPayment
                    type={selectedMethod as "gcash" | "grab_pay" | "paymaya"}
                    amount={amount}
                    subscriptionId={subscriptionId}
                    billingCycle={billingCycle}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onBack={handleBack}
                  />
                )}

              {currentStep === 2 && (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-100 rounded-full p-4">
                      <Check className="h-12 w-12 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Payment Successful!
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Thank you for your subscription. Your payment has been
                      processed successfully.
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Redirecting to dashboard in {countdown} seconds...
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => setShouldRedirect(true)}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                    >
                      Go to Dashboard Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <PaymentSummary
                planName={subscriptionId}
                amount={amount}
                billingCycle={billingCycle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;