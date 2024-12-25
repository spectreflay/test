import UserSubscription from '../models/userSubscriptionModel.js';

export const activatePendingRenewal = async (subscription) => {
  if (!subscription.pendingRenewal) {
    return null;
  }

  const newSubscription = await UserSubscription.create({
    user: subscription.user,
    subscription: subscription.pendingRenewal.subscription,
    status: 'active',
    startDate: subscription.pendingRenewal.startDate,
    endDate: subscription.pendingRenewal.endDate,
    billingCycle: subscription.pendingRenewal.billingCycle,
    paymentMethod: subscription.pendingRenewal.paymentMethod,
    paymentDetails: subscription.pendingRenewal.paymentDetails,
    autoRenew: true
  });

  // Clear pending renewal and mark current subscription as expired
  subscription.status = 'expired';
  subscription.pendingRenewal = null;
  await subscription.save();

  return newSubscription;
};