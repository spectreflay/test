export const SUBSCRIPTION_FEATURES = {
    FREE: {
      maxProducts: 10,
      maxStaff: 2,
      maxStores: 1,
      features: [
        'basic_reports',
        'basic_inventory'
      ]
    },
    BASIC: {
      maxProducts: 100,
      maxStaff: 5,
      maxStores: 2,
      features: [
        'unlimited_products',
        'inventory_alerts',
        'advanced_reports'
      ]
    },
    PREMIUM: {
      maxProducts: Infinity,
      maxStaff: Infinity,
      maxStores: Infinity,
      features: [
        'unlimited_products',
        'unlimited_staff',
        'advanced_reports',
        'inventory_alerts',
        'multiple_stores',
        'custom_roles',
        'api_access',
        'priority_support'
      ]
    }
  };
  
  export const hasFeature = (userSubscription: any, feature: string): boolean => {
    if (!userSubscription || userSubscription.status !== 'active') {
      return false;
    }
    return userSubscription.subscription.features.includes(feature);
  };
  
  export const isWithinLimits = (
    userSubscription: any,
    type: 'products' | 'staff' | 'stores',
    currentCount: number
  ): boolean => {
    if (!userSubscription || userSubscription.status !== 'active') {
      return false;
    }
  
    const limits = {
      products: userSubscription.subscription.maxProducts,
      staff: userSubscription.subscription.maxStaff,
      stores: userSubscription.subscription.maxStores
    };
  
    return currentCount < limits[type];
  };