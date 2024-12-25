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

// Subscribe or upgrade/downgrade with advance renewal support
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, paymentDetails, billingCycle = 'monthly', isAdvanceRenewal = false } = req.body;

    // Get current subscription if exists
    const currentSubscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    // Calculate start and end dates
    const startDate = isAdvanceRenewal && currentSubscription 
      ? new Date(currentSubscription.endDate)
      : new Date();
    
    const endDate = new Date(startDate);
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // If this is an advance renewal and there's an active subscription
    if (isAdvanceRenewal && currentSubscription) {
      // Update current subscription with pending renewal
      currentSubscription.pendingRenewal = {
        subscription: subscriptionId,
        startDate,
        endDate,
        billingCycle,
        paymentMethod,
        paymentDetails
      };
      await currentSubscription.save();

      // Record in history
      await SubscriptionHistory.create({
        user: req.user._id,
        subscription: subscriptionId,
        action: 'subscribed',
        reason: 'advance_renewal',
        billingCycle,
        startDate,
        endDate,
        autoRenew: true,
        paymentMethod,
        paymentDetails
      });

      res.status(201).json(currentSubscription);
      return;
    }

    // For immediate subscription changes
    if (currentSubscription) {
      currentSubscription.status = 'cancelled';
      currentSubscription.autoRenew = false;
      await currentSubscription.save();

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
    subscription.pendingRenewal = null; // Clear any pending renewals
    await subscription.save();

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

// Get pending renewal details
router.get('/pending-renewal', protect, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active',
      pendingRenewal: { $exists: true, $ne: null }
    }).populate('pendingRenewal.subscription');

    if (!subscription || !subscription.pendingRenewal) {
      return res.status(404).json({ message: 'No pending renewal found' });
    }

    res.json(subscription.pendingRenewal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel pending renewal
router.post('/cancel-pending-renewal', protect, async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!subscription || !subscription.pendingRenewal) {
      return res.status(404).json({ message: 'No pending renewal found' });
    }

    subscription.pendingRenewal = null;
    await subscription.save();

    await SubscriptionHistory.create({
      user: req.user._id,
      subscription: subscription.subscription,
      action: 'cancelled',
      reason: 'pending_renewal_cancelled',
      billingCycle: subscription.billingCycle,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      paymentMethod: subscription.paymentMethod,
      paymentDetails: subscription.paymentDetails
    });

    res.json({ message: 'Pending renewal cancelled successfully' });
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

// Create advance subscription
router.post('/advance-subscribe', protect, async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, billingCycle, paymentDetails } = req.body;

    // Calculate start and end dates based on current subscription
    const currentSubscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!currentSubscription) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    const startDate = new Date(currentSubscription.endDate);
    const endDate = new Date(startDate);
    
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create pending subscription
    const pendingSubscription = await PendingSubscription.create({
      user: req.user._id,
      subscription: subscriptionId,
      startDate,
      endDate,
      billingCycle,
      paymentMethod,
      paymentDetails,
      status: 'pending'
    });

    res.status(201).json(pendingSubscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get pending subscriptions
router.get('/pending', protect, async (req, res) => {
  try {
    const pendingSubscriptions = await PendingSubscription.find({
      user: req.user._id,
      status: 'pending'
    }).populate('subscription');
    
    res.json(pendingSubscriptions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel pending subscription
router.post('/pending/:id/cancel', protect, async (req, res) => {
  try {
    const pendingSubscription = await PendingSubscription.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'pending'
    });

    if (!pendingSubscription) {
      return res.status(404).json({ message: 'Pending subscription not found' });
    }

    pendingSubscription.status = 'cancelled';
    await pendingSubscription.save();

    res.json({ message: 'Pending subscription cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;