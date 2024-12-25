import mongoose from 'mongoose';

const cardDetailsSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    set: (number) => number.slice(-4),
  },
  expMonth: {
    type: Number,
    required: true,
  },
  expYear: {
    type: Number,
    required: true,
  },
  cardHolder: {
    type: String,
    required: true,
  },
});

const pendingRenewalSchema = new mongoose.Schema({
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
    enum: ['card', 'paypal','free','ewallet','gcash','maya','grab_pay']
  },
  paymentDetails: {
    paymentId: String,
    amount: Number,
    status: String,
    cardDetails: cardDetailsSchema
  }
});

const userSubscriptionSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal','free','ewallet','gcash','maya','grab_pay']
  },
  paymentDetails: {
    paymentId: String,
    amount: Number,
    status: String,
    cardDetails: cardDetailsSchema
  },
  pendingRenewal: pendingRenewalSchema
}, {
  timestamps: true
});

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
export default UserSubscription;