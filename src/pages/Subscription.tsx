import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Store, X, History, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetSubscriptionsQuery,
  useGetCurrentSubscriptionQuery,
  useSubscribeMutation,
  useVerifySubscriptionMutation,
  useGetSubscriptionHistoryQuery,
} from "../store/services/subscriptionService";
import PaymentModal from "../components/payment/PaymentModal";
import BillingCycleToggle from "../components/subscription/BillingCycleToggle";
import SubscriptionHistory from "../components/subscription/SubscriptionHistory";

const SubscriptionPage = () => {
  const { data: subscriptions } = useGetSubscriptionsQuery();
  const { data: currentSubscription, refetch: refetchCurrentSubscription } =
    useGetCurrentSubscriptionQuery();
  const { data: subscriptionHistory } = useGetSubscriptionHistoryQuery();
  const [subscribe] = useSubscribeMutation();
  const [verifySubscription] = useVerifySubscriptionMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showHistory, setShowHistory] = useState(false);

  // Calculate price based on billing cycle
  const calculatePrice = (subscription: any) => {
    if (billingCycle === "yearly") {
      return subscription.yearlyPrice.toFixed(2);
    }
    return subscription.monthlyPrice.toFixed(2);
  };

  const calculatePriceDisplay = (subscription: any) => {
    const originalPrice =
      billingCycle === "yearly"
        ? subscription.monthlyPrice * 12 // Show annual price without discount
        : subscription.monthlyPrice;

    const discountedPrice =
      billingCycle === "yearly"
        ? subscription.yearlyPrice // Already discounted
        : subscription.monthlyPrice;

    return {
      original: originalPrice.toFixed(2),
      discounted: discountedPrice.toFixed(2),
      hasDiscount: billingCycle === "yearly",
    };
  };

  // Handle payment status from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    const paymentId = params.get("payment_id");

    if (status === "success" && paymentId) {
      handlePaymentVerification(paymentId);
      if (typeof window !== "undefined") {
        window.close();
      }
    } else if (status === "failed") {
      toast.error("Payment failed. Please try again.");
      navigate("/subscription", { replace: true });
    }
  }, [location, navigate]);

  const handlePaymentVerification = async (paymentId: string) => {
    try {
      await verifySubscription({ paymentId }).unwrap();
      await refetchCurrentSubscription();
      toast.success("Payment successful!");
      navigate("/subscription", { replace: true });
    } catch (error) {
      toast.error("Failed to verify payment. Please contact support.");
      navigate("/subscription", { replace: true });
    }
  };

  const handleSubscribe = async (subscription: any) => {
    // Allow upgrading from a lower tier to a higher tier
    if (currentSubscription?.subscription._id === subscription._id) {
      toast.error("You are already subscribed to this plan");
      return;
    }

    // Check if trying to downgrade
    const currentTier = getTierLevel(currentSubscription?.subscription.name);
    const newTier = getTierLevel(subscription.name);
    if (newTier < currentTier) {
      toast.error("Please contact support to downgrade your subscription");
      return;
    }

    setSelectedPlan(subscription);
    setShowPaymentModal(true);
  };

  const getTierLevel = (planName?: string) => {
    switch (planName) {
      case "premium":
        return 3;
      case "basic":
        return 2;
      case "free":
        return 1;
      default:
        return 0;
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      await refetchCurrentSubscription();
      setShowPaymentModal(false);
      navigate("/stores");
    } catch (error) {
      toast.error("Failed to update subscription status");
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-bold text-gray-900">
                IREGO POS
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <History className="h-5 w-5" />
                History
              </button>
              <Link
                to="/stores"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Choose your plan
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Select the perfect plan for your business needs
            </p>
          </div>

          <BillingCycleToggle cycle={billingCycle} onChange={setBillingCycle} />

          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
            {subscriptions?.map((subscription) => {
              const isCurrentPlan =
                currentSubscription?.subscription._id === subscription._id;
              const priceDisplay = calculatePriceDisplay(subscription);

              return (
                <div
                  key={subscription._id}
                  className={`bg-white border-2 rounded-lg shadow-sm divide-y divide-gray-200 ${
                    isCurrentPlan ? "border-primary" : "border-gray-200"
                  }`}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 flex justify-between">
                      <span className="capitalize">{subscription.name}</span>
                      {isCurrentPlan && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Current Plan
                        </span>
                      )}
                    </h3>
                    <p className="mt-4 text-sm text-gray-500">
                      Perfect for{" "}
                      {subscription.name === "free"
                        ? "getting started"
                        : subscription.name === "basic"
                        ? "small businesses"
                        : "growing businesses"}
                    </p>
                    <div className="mt-8">
                      {priceDisplay.hasDiscount && (
                        <span className="text-lg line-through text-gray-400 block">
                          ${priceDisplay.original}
                        </span>
                      )}
                      <div className="flex items-baseline">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ${priceDisplay.discounted}
                        </span>
                        <span className="text-base font-medium text-gray-500">
                          /{billingCycle}
                        </span>
                      </div>
                      {billingCycle === "yearly" && (
                        <span className="text-sm text-green-600 mt-1 block">
                          Save 20% with annual billing
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSubscribe(subscription)}
                      disabled={isCurrentPlan}
                      className={`mt-8 block w-full py-2 px-4 border border-transparent rounded-md text-white text-center font-medium ${
                        isCurrentPlan
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-primary hover:bg-primary-hover"
                      }`}
                    >
                      {isCurrentPlan ? "Current Plan" : "Subscribe"}
                    </button>
                  </div>
                  <div className="px-6 pt-6 pb-8">
                    <h4 className="text-sm font-medium text-gray-900 tracking-wide">
                      What's included
                    </h4>
                    <ul className="mt-6 space-y-4">
                      <li className="flex items-start">
                        <span className="text-green-500 flex-shrink-0">
                          <Check className="h-5 w-5" />
                        </span>
                        <span className="ml-3 text-sm text-gray-700">
                          Up to {subscription.maxProducts.toLocaleString()}{" "}
                          products
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 flex-shrink-0">
                          <Check className="h-5 w-5" />
                        </span>
                        <span className="ml-3 text-sm text-gray-700">
                          Up to {subscription.maxStaff.toLocaleString()} staff
                          members
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 flex-shrink-0">
                          <Check className="h-5 w-5" />
                        </span>
                        <span className="ml-3 text-sm text-gray-700">
                          Up to {subscription.maxStores.toLocaleString()} stores
                        </span>
                      </li>
                      {subscription.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <span className="text-green-500 flex-shrink-0">
                            <Check className="h-5 w-5" />
                          </span>
                          <span className="ml-3 text-sm text-gray-700">
                            {feature.split("_").join(" ").toUpperCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showPaymentModal && selectedPlan && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            subscriptionId={selectedPlan._id}
            amount={
              billingCycle === "yearly"
                ? selectedPlan.yearlyPrice
                : selectedPlan.monthlyPrice
            }
            onSuccess={handlePaymentSuccess}
            billingCycle={billingCycle}
          />
        )}

        {showHistory && subscriptionHistory && (
          <SubscriptionHistory
            history={subscriptionHistory.map((history) => ({
              ...history,
              amount:
                history.billingCycle === "yearly"
                  ? history.subscription.yearlyPrice
                  : history.subscription.monthlyPrice,
            }))}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </>
  );
};

export default SubscriptionPage;
