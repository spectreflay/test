import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  outOfStockThreshold: {
    type: Number,
    default: 0
  },
  criticalStockThreshold: {
    type: Number,
    default: 5
  },
  enableStockAlerts: {
    type: Boolean,
    default: true
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  automaticReorder: {
    type: Boolean,
    default: false
  },
  reorderPoint: {
    type: Number,
    default: 5
  },
  taxRate: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  timeZone: {
    type: String,
    default: 'UTC'
  },
  receiptFooter: {
    type: String,
    default: ''
  }
});

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  settings: {
    type: settingsSchema,
    default: () => ({})
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

const Store = mongoose.model('Store', storeSchema);
export default Store;