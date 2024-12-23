import mongoose from 'mongoose';

const cardDetailsSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    // Store only last 4 digits for reference
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
    cardDetails: cardDetailsSchema,
    paymentMethodId: String,
  }
}, {
  timestamps: true
});

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);
export default UserSubscription;