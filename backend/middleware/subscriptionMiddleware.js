import UserSubscription from '../models/userSubscriptionModel.js';
import { SUBSCRIPTION_FEATURES } from '../utils/subscriptionFeatures.js';

export const checkSubscriptionLimit = (feature) => async (req, res, next) => {
  try {
    const userSubscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    }).populate('subscription');

    if (!userSubscription) {
      return res.status(403).json({ message: 'No active subscription found' });
    }

    const subscription = userSubscription.subscription;
    const hasAccess = subscription.features.includes(feature);

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'This feature is not available in your current subscription plan' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking subscription limits' });
  }
};

export const checkResourceLimit = (resource) => async (req, res, next) => {
  try {
    const userSubscription = await UserSubscription.findOne({
      user: req.user._id,
      status: 'active'
    }).populate('subscription');

    if (!userSubscription) {
      return res.status(403).json({ message: 'No active subscription found' });
    }

    const subscription = userSubscription.subscription;
    let currentCount;

    switch (resource) {
      case 'products':
        currentCount = await Product.countDocuments({ store: req.params.storeId });
        if (currentCount >= subscription.maxProducts) {
          return res.status(403).json({ 
            message: 'You have reached the maximum number of products for your subscription plan' 
          });
        }
        break;
      case 'staff':
        currentCount = await Staff.countDocuments({ store: req.params.storeId });
        if (currentCount >= subscription.maxStaff) {
          return res.status(403).json({ 
            message: 'You have reached the maximum number of staff members for your subscription plan' 
          });
        }
        break;
      case 'stores':
        currentCount = await Store.countDocuments({ owner: req.user._id });
        if (currentCount >= subscription.maxStores) {
          return res.status(403).json({ 
            message: 'You have reached the maximum number of stores for your subscription plan' 
          });
        }
        break;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking resource limits' });
  }
};