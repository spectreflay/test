import express from 'express';
import crypto from 'crypto';
import UserSubscription from '../models/userSubscriptionModel.js';
// import { createNotification } from '../../src/utils/notification.js';

const router = express.Router();

// Verify Xendit webhook signature
const verifyXenditSignature = (req) => {
  const xenditSignature = req.headers['x-callback-token'];
  const webhookSecret = process.env.XENDIT_WEBHOOK_SECRET;

  if (!xenditSignature || !webhookSecret) {
    return false;
  }

  const computedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return xenditSignature === computedSignature;
};

// Handle subscription events from Xendit
router.post('/xendit', async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyXenditSignature(req)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    switch (event) {
      case 'subscription.activated':
        await handleSubscriptionActivated(data);
        break;
      case 'subscription.expired':
        await handleSubscriptionExpired(data);
        break;
      case 'subscription.failed':
        await handleSubscriptionFailed(data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
});

// Handle subscription activated event
const handleSubscriptionActivated = async (data) => {
  const subscription = await UserSubscription.findOne({
    'paymentDetails.xenditSubscriptionId': data.id
  }).populate('user');

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update subscription status
  subscription.status = 'active';
  subscription.endDate = new Date(data.next_charge_date);
  await subscription.save();

  // Create notification
  await createNotification({
    recipient: subscription.user._id,
    message: 'Your subscription has been successfully renewed.',
    type: 'system'
  });
};

// Handle subscription expired event
const handleSubscriptionExpired = async (data) => {
  const subscription = await UserSubscription.findOne({
    'paymentDetails.xenditSubscriptionId': data.id
  }).populate('user');

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update subscription status
  subscription.status = 'expired';
  subscription.autoRenew = false;
  await subscription.save();

  // Create notification
  await createNotification({
    recipient: subscription.user._id,
    message: 'Your subscription has expired.',
    type: 'alert'
  });
};

// Handle subscription failed event
const handleSubscriptionFailed = async (data) => {
  const subscription = await UserSubscription.findOne({
    'paymentDetails.xenditSubscriptionId': data.id
  }).populate('user');

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Create notification
  await createNotification({
    recipient: subscription.user._id,
    message: `Subscription renewal failed: ${data.failure_reason}. Please update your payment method.`,
    type: 'alert'
  });
};

// Handle subscription cancelled event
const handleSubscriptionCancelled = async (data) => {
  const subscription = await UserSubscription.findOne({
    'paymentDetails.xenditSubscriptionId': data.id
  }).populate('user');

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update subscription status
  subscription.status = 'cancelled';
  subscription.autoRenew = false;
  await subscription.save();

  // Create notification
  await createNotification({
    recipient: subscription.user._id,
    message: 'Your subscription has been cancelled.',
    type: 'system'
  });
};

export default router;