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
      case "recurring.plan.inactived":
        await handleSubscriptionCancelled(data);
        break;
      case "recurring.cycle.succeeded":
        await handleSubscriptionCycleSucceeded();
        break;
      case "recurring.cycle.created":
        await handleSubscriptionCycleCreated();
        break;
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
    status: "pending",
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
    status: "active",
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

  await createNotification({
    recipient: subscription.user,
    message: `Your subscription next billing will be scheduled on ${data.scheduled_timestamp}.`,
    type: "system",
  });
};

const handleSubscriptionCycleSucceeded = async (data) => {
  const subscription = await UserSubscription.findOne({
    xenditSubscriptionId: data.plan_id,
  }).populate("user");

  await createNotification({
    recipient: subscription.user,
    message: `Your subscription billing date ${data.scheduled_timestamp} is succesfully paid.`,
    type: "system",
  });
};

export default router;
