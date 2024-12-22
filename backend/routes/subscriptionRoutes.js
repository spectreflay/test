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

    // Cancel current subscription
    if (currentSubscription) {
      currentSubscription.status = 'cancelled';
      currentSubscription.autoRenew = false;
      await currentSubscription.save();

      // Record in history
      await SubscriptionHistory.create({
        user: req.user._id,
        subscription: currentSubscription.subscription,
        action: 'cancelled',
        reason: 'upgrade/downgrade'
      });
    }

    // Calculate end date based on billing cycle
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create new subscription
    const userSubscription = await UserSubscription.create({
      user: req.user._id,
      subscription: subscriptionId,
      status: 'active',
      startDate: new Date(),
      endDate,
      billingCycle,
      prorationCredit,
      paymentMethod,
      paymentDetails,
      autoRenew: true
    });

    // Record in history
    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscriptionId,
      action: 'subscribed',
      billingCycle
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

    // Record in history
    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscription.subscription,
      action: 'cancelled',
      reason: 'user_requested'
    });

    res.json({ message: 'Subscription cancelled successfully' });
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

    // Update end date based on new billing cycle
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    subscription.billingCycle = billingCycle;
    subscription.endDate = endDate;
    await subscription.save();

    // Record in history
    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscription.subscription,
      action: 'billing_cycle_changed',
      billingCycle
    });

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;