import express from 'express';
import { updateSubscriptionStatus } from '../../controllers/subscriptionController.js';

const router = express.Router();

router.post('/xendit', async (req, res) => {
  try {
    const event = req.body;
    
    switch (event.event) {
      case 'subscription.activated':
        await updateSubscriptionStatus(event.data.subscription_id, 'active');
        break;
      case 'subscription.expired':
        await updateSubscriptionStatus(event.data.subscription_id, 'expired');
        break;
      case 'subscription.failed':
        // Handle failed payment - notify user and retry
        await updateSubscriptionStatus(event.data.subscription_id, 'failed');
        break;
      case 'subscription.cancelled':
        await updateSubscriptionStatus(event.data.subscription_id, 'cancelled');
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;