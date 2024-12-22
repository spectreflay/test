import mongoose from 'mongoose';

const subscriptionHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  action: {
    type: String,
    enum: ['subscribed', 'cancelled', 'billing_cycle_changed'],
    required: true
  },
  reason: String,
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'gcash', 'grab_pay', 'maya', 'free'],
  },
  paymentDetails: {
    paymentId: String,
    amount: Number,
    status: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SubscriptionHistory = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
export default SubscriptionHistory;