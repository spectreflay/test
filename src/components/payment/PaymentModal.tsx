import React, { useState } from "react";
import { X, CreditCard, AlertCircle } from "lucide-react";
import PaymentSummary from "./PaymentSummary";
import { createSubscription, getSubscriptionStatus } from "../../utils/xendit";
import {
  useSubscribeMutation,
  useUpdateSubscriptionStatusMutation,
} from "../../store/services/subscriptionService";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  subscriptionName: string;
  isSubscribed: boolean;
  amount: any;
  billingCycle: "monthly" | "yearly";
  onSuccess: () => void;
}

const STEPS = ["Summary", "Payment", "Confirmation"];

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  subscriptionName,
  isSubscribed,
  amount,
  billingCycle,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscribe] = useSubscribeMutation();
  const [updateSubscriptionStatus] = useUpdateSubscriptionStatusMutation();
  const isDevelopment = import.meta.env.MODE === "development";
  const { user } = useSelector((state: RootState) => state.auth);

  const handleInitiatePayment = async () => {
    try {
      setIsProcessing(true);
      //conver amount string into a number by removing money sign
      const amountNumber = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
      // If it's a free plan, handle differently
      if (subscriptionName === "free") {
        // Cancel current subscription if exists
        if (isSubscribed) {
          await updateSubscriptionStatus({ status: "cancelled" }).unwrap();
        }

        // Activate free subscription
        await subscribe({
          subscriptionId,
          xenditSubscriptionId: "",
          paymentMethod: "FREE",
          billingCycle,
          status: "active",
        }).unwrap();

        setCurrentStep(2);
        toast.success("Free plan activated successfully!");
        setIsProcessing(false);
        return;
      }

      if (!user?.xenditCustomerId) {
        throw new Error("Customer ID not found");
      }

      // Create Xendit subscription
      const subscription = await createSubscription(
        `sub-${Date.now()}`,
        user.xenditCustomerId,
        amountNumber,
        billingCycle
      );

      if (!subscription.linkingUrl) {
        throw new Error("No payment linking URL provided");
      }

      // Open payment window
      const paymentWindow = window.open(
        subscription.linkingUrl,
        "xenditPayment",
        "width=600,height=600"
      );
      
      // First create a pending subscription
      const pendingSubscription = await subscribe({
        subscriptionId,
        xenditSubscriptionId: subscription.id,
        paymentMethod: "PENDING",
        billingCycle,
        status: "pending",
      }).unwrap();

      const pollInterval = setInterval(async () => {
        try {
          const status = await getSubscriptionStatus(subscription.id);
          if (status.status === "ACTIVE") {
            clearInterval(pollInterval);
            if (paymentWindow) {
              paymentWindow.close();
            }
            setCurrentStep(2); // Move to confirmation step
            toast.success("Subscription activated successfully!");
          } else if (
            status.status === "FAILED" ||
            status.status === "EXPIRED"
          ) {
            clearInterval(pollInterval);
            if (paymentWindow) {
              paymentWindow.close();
            }
            toast.error("Payment failed or expired");
            setIsProcessing(false);
          }
        } catch (error) {
          console.error("Error checking subscription status:", error);
        }
      }, 10000);

      // Cleanup interval if modal is closed
      return () => {
        clearInterval(pollInterval);
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.close();
        }
      };
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
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

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          {STEPS.map((step, index) => (
            <React.Fragment key={step}>
              {index > 0 && (
                <div
                  className={`h-1 w-16 mx-2 self-center ${
                    index <= currentStep ? "bg-primary" : "bg-gray-200"
                  }`}
                />
              )}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? "bg-primary text-white"
                      : index === currentStep
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-sm mt-2 ${
                    index <= currentStep ? "text-primary" : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {currentStep === 0 && (
              <div className="space-y-6">
                <PaymentSummary
                  planName={subscriptionName}
                  amount={amount}
                  billingCycle={billingCycle}
                />
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  {amount !== 0 ? "Continue to Payment" : "Next"}
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                {isDevelopment && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">
                          Development Mode
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          You will be redirected to Xendit's test payment page.
                          Use test card details or test e-wallet credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-4">
                  <CreditCard className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-gray-600">
                    {subscriptionName == "free"
                      ? "You will activate the free plan."
                      : `You will be redirected to Xendit's secure payment page to complete your payment.`}
                  </p>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={isProcessing}
                    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
                  >
                    {subscriptionName == "free"
                      ? isProcessing
                        ? "Processing..."
                        : "Activate"
                      : isProcessing
                      ? "Processing..."
                      : "Proceed to Payment"}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center">
                  <div className="bg-green-100 rounded-full p-4">
                    <svg
                      className="h-12 w-12 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
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
                <button
                  onClick={onSuccess}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
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
