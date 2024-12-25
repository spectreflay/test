import mongoose from 'mongoose';

const pendingSubscriptionSchema = new mongoose.Schema({
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'gcash', 'grab_pay', 'maya'],
    required: true
  },
  paymentDetails: {
    paymentId: String,
    amount: Number,
    status: String,
    cardDetails: {
      cardNumber: String,
      expMonth: Number,
      expYear: Number,
      cardHolder: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 365 // Document expires after 1 year if not activated
  }
});

const PendingSubscription = mongoose.model('PendingSubscription', pendingSubscriptionSchema);
export default PendingSubscription;