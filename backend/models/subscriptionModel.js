import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'premium']
  },
  features: [{
    type: String,
    enum: [
      'unlimited_products',
      'unlimited_staff',
      'advanced_reports',
      'inventory_alerts',
      'multiple_stores',
      'custom_roles',
      'api_access',
      'priority_support',
      'basic_reports',
      'basic_inventory'
    ]
  }],
  maxProducts: {
    type: Number,
    required: true
  },
  maxStaff: {
    type: Number,
    required: true
  },
  maxStores: {
    type: Number,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  yearlyPrice: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;