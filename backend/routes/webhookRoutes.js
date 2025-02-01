import express from "express";
import UserSubscription from "../models/userSubscriptionModel.js";
import {
  createNotification,
  getSubscriptionNotificationMessage,
} from "../utils/notification.js";

const router = express.Router();

// Verify Xendit webhook signature
const verifyXenditSignature = (req) => {
  const xenditSignature = req.headers["x-callback-token"];
  const webhookSecret = process.env.XENDIT_WEBHOOK_SECRET;

  // Log headers and secret for debugging
  console.log("Received Headers:", req.headers);
  console.log("Webhook Secret:", webhookSecret);

  if (!xenditSignature || !webhookSecret) {
    console.log("Missing signature or secret");
    return false;
  }

  // For Xendit recurring payments, the signature is simply compared with the webhook secret
  return xenditSignature === webhookSecret;
};

// Handle subscription events from Xendit
router.post("/xendit", async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyXenditSignature(req)) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { event, data } = req.body;

    switch (event) {
      case "recurring.plan.activated":
        await handleSubscriptionActivated(data);
        break;
      case "recurring.plan.expired":
        await handleSubscriptionExpired(data);
        break;
      case "recurring.plan.failed":
        await handleSubscriptionFailed(data);
        break;
      case "recurring.plan.inactivated":
        await handleSubscriptionCancelled(data);
        break;
      case "recurring.cycle.succeeded":
        await handleSubscriptionCycleSucceeded(data);
        break;
      case "recurring.cycle.created":
        await handleSubscriptionCycleCreated(data);
        break;
      case "payment_method.activated":
        await handleSubscriptionPaymentMethod(data);
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Error processing webhook" });
  }
});

// Handle subscription activated event
const handleSubscriptionActivated = async (data) => {
  const pendingSubscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.id,
  }).populate("user");

  if (pendingSubscription.status === "active") {
    await createNotification({
      recipient: pendingSubscription.user,
      message: "Your subscription is already active.",
      type: "system",
    });
    return;
  }

  if (!pendingSubscription) {
    throw new Error("Subscription not found");
  }

  // Find and cancel current active subscription if exists
  const currentSubscription = await UserSubscription.findOne({
    user: pendingSubscription.user._id,
    status: "active",
  });

  if (currentSubscription) {
    currentSubscription.status = "cancelled";
    await currentSubscription.save();
  }

  // Activate pending subscription
  pendingSubscription.status = "active";

  // Checking payment methods
  if (Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
    pendingSubscription.paymentMethod = data.payment_methods[0].type;
  } else {
    pendingSubscription.paymentMethod = "UNKNOWN"; // Default value in case of missing data
  }
  await pendingSubscription.save();

  // Create notification
  await createNotification({
    recipient: pendingSubscription.user,
    message: "Your subscription has been successfully activated",
    type: "system",
  });
};

// Handle subscription expired event
const handleSubscriptionExpired = async (data) => {
  const subscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.plan_id,
  }).populate("user");

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Update subscription status
  subscription.status = "expired";
  subscription.autoRenew = false;
  await subscription.save();

  // Create notification
  await createNotification({
    recipient: subscription.user._id,
    message: getSubscriptionNotificationMessage("subscription.expired"),
    type: "alert",
  });
};

// Handle subscription failed event
const handleSubscriptionFailed = async (data) => {
  const subscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.plan_id,
  }).populate("user");

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Create notification
  await createNotification({
    recipient: subscription.user,
    message: `Subscription renewal failed: ${data.failure_reason}. Please update your payment method.`,
    type: "alert",
  });
};

// Handle subscription cancelled event
const handleSubscriptionCancelled = async (data) => {
  const subscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.id,
  }).populate("user");

  if (subscription.status === "cancelled") {
    // Create notification
    await createNotification({
      recipient: subscription.user,
      message: "Your subscription is already cancelled.",
      type: "system",
    });
    return;
  }

  if (subscription.status === "expired") {
    // Create notification
    await createNotification({
      recipient: subscription.user,
      message: "Your subscription is expired please contact the administrator.",
      type: "system",
    });
    return;
  }

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Update subscription status
  subscription.status = "cancelled";
  subscription.autoRenew = false;
  await subscription.save();

  // Create notification
  await createNotification({
    recipient: subscription.user,
    message: "Your subscription has been cancelled.",
    type: "system",
  });
};

const handleSubscriptionCycleCreated = async (data) => {
  const subscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.plan_id,
  }).populate("user");

  if (subscription) {
    // Update next billing cycle dates
    // subscription.startDate = new Date(data.scheduled_timestamp);

    // Extend the subscription based on billing cycle
    const newEndDate = new Date(subscription.endDate);
    if (subscription.billingCycle === "monthly") {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (subscription.billingCycle === "yearly") {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }
    // subscription.endDate = newEndDate;

    // await subscription.save();

    await createNotification({
      recipient: subscription.user,
      message: `Your next subscription cycle is scheduled to start on ${new Date(
        data.scheduled_timestamp
      ).toLocaleDateString()} and will be valid until ${newEndDate.toLocaleDateString()}.`,
      type: "system",
    });
  }
};

const handleSubscriptionCycleSucceeded = async (data) => {
  const subscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.plan_id,
  }).populate("user");

  if (subscription) {
    // Update subscription data
    const currentDate = new Date(data.scheduled_timestamp);

    // Only update the start date if the current date is after the existing start date
    if (currentDate > subscription.startDate) {
      subscription.startDate = currentDate;
    }

    // Calculate the new end date based on the billing cycle
    let newEndDate;
    if (subscription.billingCycle === "monthly") {
      newEndDate = new Date(currentDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (subscription.billingCycle === "yearly") {
      newEndDate = new Date(currentDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    // Only update the end date if the new end date is later than the existing end date
    if (newEndDate > subscription.endDate) {
      subscription.endDate = newEndDate;
    }

    await subscription.save();

    await createNotification({
      recipient: subscription.user,
      message: `Your subscription payment for ${data.amount} ${
        data.currency
      } on ${currentDate.toLocaleDateString()} was successful. Your subscription is valid until ${subscription.endDate.toLocaleDateString()}.`,
      type: "system",
    });
  } else {
    console.error(`No subscription found for plan_id: ${data.plan_id}`);
  }
};

const handleSubscriptionPaymentMethod = async (data) => {};

export default router;
