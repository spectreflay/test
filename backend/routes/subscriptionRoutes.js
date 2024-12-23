import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Subscription from '../models/subscriptionModel.js';
import UserSubscription from '../models/userSubscriptionModel.js';
import SubscriptionHistory from '../models/subscriptionHistoryModel.js';

const router = express.Router();

// Get all available subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user's subscription
router.get('/current', protect, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    }).populate('subscription');
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subscription history
router.get('/history', protect, async (req, res) => {
  try {
    const history = await SubscriptionHistory.find({
      user: req.user._id
    })
    .populate('subscription')
    .sort('-createdAt');
    res.json(history);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Subscribe or upgrade/downgrade
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, paymentDetails, billingCycle = 'monthly' } = req.body;

    // Get current subscription if exists
    const currentSubscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    // Calculate proration if upgrading/downgrading
    let prorationCredit = 0;
    if (currentSubscription) {
      const daysLeft = Math.ceil((new Date(currentSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      const dailyRate = currentSubscription.subscription.price / 30;
      prorationCredit = daysLeft * dailyRate;
    }

    // Calculate end date based on billing cycle
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Cancel current subscription
    if (currentSubscription) {
      currentSubscription.status = 'cancelled';
      currentSubscription.autoRenew = false;
      await currentSubscription.save();

      // Record cancellation in history
      await SubscriptionHistory.create({
        user: req.user._id,
        subscription: currentSubscription.subscription,
        action: 'cancelled',
        reason: 'upgrade/downgrade',
        billingCycle: currentSubscription.billingCycle,
        startDate: currentSubscription.startDate,
        endDate: currentSubscription.endDate,
        autoRenew: false,
        paymentMethod: currentSubscription.paymentMethod,
        paymentDetails: currentSubscription.paymentDetails
      });
    }

    // Create new subscription
    const userSubscription = await UserSubscription.create({
      user: req.user._id,
      subscription: subscriptionId,
      status: 'active',
      startDate,
      endDate,
      billingCycle,
      prorationCredit,
      paymentMethod,
      paymentDetails,
      autoRenew: true
    });

    // Record subscription in history
    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscriptionId,
      action: 'subscribed',
      billingCycle,
      startDate,
      endDate,
      autoRenew: true,
      paymentMethod,
      paymentDetails
    });

    const populatedSubscription = await UserSubscription.findById(userSubscription._id)
      .populate('subscription');

    res.status(201).json(populatedSubscription);
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Cancel subscription
router.post('/cancel', protect, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Record cancellation in history
    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscription.subscription,
      action: 'cancelled',
      reason: 'user_requested',
      billingCycle: subscription.billingCycle,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: false,
      paymentMethod: subscription.paymentMethod,
      paymentDetails: subscription.paymentDetails
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// Update subscription status
router.put('/status', protect, async (req, res) => {
  try {
    const { status } = req.body; // Expecting { status: 'active' | 'cancelled' | 'expired' }

    // Find the user's active subscription
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: { $ne: 'cancelled' } // Exclude cancelled subscriptions
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Update the subscription status
    subscription.status = status;
    await subscription.save();

    res.json({ message: 'Subscription status updated successfully', subscription });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change billing cycle
router.post('/change-billing-cycle', protect, async (req, res) => {
  try {
    const { billingCycle } = req.body;
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Calculate new end date based on billing cycle
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    subscription.billingCycle = billingCycle;
    subscription.endDate = endDate;
    await subscription.save();

    // Record billing cycle change in history
    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscription.subscription,
      action: 'billing_cycle_changed',
      billingCycle,
      startDate: subscription.startDate,
      endDate,
      autoRenew: subscription.autoRenew,
      paymentMethod: subscription.paymentMethod,
      paymentDetails: subscription.paymentDetails
    });

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;