import express from 'express';
import {
  createCustomer,
  createSubscriptionPlan,
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
} from '../../src/utils/xendit';

const router = express.Router();

router.post('/create-customer', async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    const customer = await createCustomer({ email, name, phone });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/create-subscription', async (req, res) => {
  try {
    const { planId, customerId } = req.body;
    const subscription = await createSubscription({ planId, customerId });
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/verify-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const status = await getSubscriptionStatus(subscriptionId);
    res.json(status);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    await cancelSubscription(subscriptionId);
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;