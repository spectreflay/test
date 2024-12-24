import React, { useState } from "react";
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { createPaymentMethod, createPaymentIntent, confirmPaymentIntent } from "../../utils/paymongo";
import { useSubscribeMutation, useVerifySubscriptionMutation } from "../../store/services/subscriptionService";

interface CardPaymentFormProps {
  amount: number;
  subscriptionId: string;
  billingCycle: "monthly" | "yearly";
  customerId: string;
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
  customerId,
  onSuccess,
  onBack,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<CardFormData>();
  const [subscribe] = useSubscribeMutation();
  const [verifySubscription] = useVerifySubscriptionMutation();

  const onSubmit = async (data: CardFormData) => {
    console.log("Form submitted with data:", data);
    try {
      setIsProcessing(true);

      // Create payment method
      const paymentMethodData: any = {
        type: "card",
        details: {
          card_number: data.cardNumber.replace(/\s/g, ""),
          exp_month: parseInt(data.expMonth),
          exp_year: parseInt(data.expYear),
          cvc: data.cvc,
        },
        billing: {
          name: data.cardHolder,
          email: "customer@example.com", // You might want to add an email field to your form
          phone: "09123456789" // You might want to add a phone field to your form
        }
      };

      const paymentMethod = await createPaymentMethod(paymentMethodData);

      console.log("Payment method created:", paymentMethod);

      // Create payment intent
      const paymentIntentData: any = {
        amount,
        paymentMethodAllowed: ["card"],
        description: "Subscription Payment",
        currency: "PHP",
        customerId,
        metadata: {
          subscriptionId,
          billingCycle,
        },
      };

      const paymentIntent = await createPaymentIntent(paymentIntentData);

      console.log("Payment intent created:", paymentIntent);

      // Confirm the payment intent with the payment method
      const confirmedIntent = await confirmPaymentIntent(paymentIntent.id, paymentMethod.id);

      console.log("Payment intent confirmed:", confirmedIntent);

      if (confirmedIntent.attributes.status === 'succeeded') {
        const paymentDetails = {
          paymentId: confirmedIntent.id,
          amount,
          status: "completed",
          paymentMethodId: paymentMethod.id,
        };

        // Update subscription with payment and card details
        const subscriptionResult = await subscribe({
          subscriptionId,
          paymentMethod: "card",
          billingCycle,
          autoRenew: true,
          paymentDetails: paymentDetails,
        }).unwrap();

        console.log("Subscription updated:", subscriptionResult);

        // Verify the subscription payment
        await verifySubscription({ paymentId: confirmedIntent.id }).unwrap();

        toast.success("Payment successful!");
        onSuccess();
      } else if (confirmedIntent.attributes.status === 'awaiting_next_action') {
        // Handle 3D Secure authentication if required
        window.location.href = confirmedIntent.attributes.next_action.redirect.url;
      } else {
        throw new Error(`Unexpected payment intent status: ${confirmedIntent.attributes.status}`);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        const paymongoError = error.response.data.errors[0];
        onError(paymongoError.detail || "Payment failed");
      } else {
        onError(error.message || "Payment failed");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Card Holder Name
          </label>
          <input
            type="text"
            {...register("cardHolder", {
              required: "Card holder name is required",
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
          {errors.cardHolder && (
            <p className="mt-1 text-sm text-red-600">
              {errors.cardHolder.message}
            </p>
          )}
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
              {...register("cardNumber", {
                required: "Card number is required",
                pattern: {
                  value: /^[\d\s]{16,19}$/,
                  message: "Invalid card number",
                },
              })}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              placeholder="4343 4343 4343 4343"
            />
          </div>
          {errors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">
              {errors.cardNumber.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Month
            </label>
            <input
              type="text"
              {...register("expMonth", {
                required: "Required",
                pattern: {
                  value: /^(0[1-9]|1[0-2])$/,
                  message: "Invalid month",
                },
              })}
              placeholder="MM"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            {errors.expMonth && (
              <p className="mt-1 text-sm text-red-600">
                {errors.expMonth.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <input
              type="text"
              {...register("expYear", {
                required: "Required",
                pattern: {
                  value: /^20[2-9][0-9]$/,
                  message: "Invalid year",
                },
              })}
              placeholder="YYYY"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            {errors.expYear && (
              <p className="mt-1 text-sm text-red-600">
                {errors.expYear.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              CVC
            </label>
            <input
              type="text"
              {...register("cvc", {
                required: "Required",
                pattern: {
                  value: /^\d{3,4}$/,
                  message: "Invalid CVC",
                },
              })}
              placeholder="123"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
            {errors.cvc && (
              <p className="mt-1 text-sm text-red-600">{errors.cvc.message}</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

export default CardPaymentForm;

