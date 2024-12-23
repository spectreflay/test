
import { canAccessFeatureWithSubscription } from './subscription/subscriptionRestrictions';
import { useGetCurrentSubscriptionQuery } from '../store/services/subscriptionService';

export type Permission = {
  name: string;
  module: 'sales' | 'inventory' | 'reports' | 'users' | 'settings';
  description: string;
};

export const PERMISSIONS = {
  VIEW_SALES: 'view_sales',
  CREATE_SALE: 'create_sale',
  MANAGE_INVENTORY: 'manage_inventory',
  VIEW_REPORTS: 'view_reports',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
};

export const hasPermission = (userPermissions: Permission[], requiredPermission: string): boolean => {
    // Get current subscription
    const { data: subscription } = useGetCurrentSubscriptionQuery();

    // First check if user has permission based on subscription
    if (!canAccessFeatureWithSubscription(subscription, requiredPermission)) {
      return false;
    }
  return userPermissions.some(permission => permission.name === requiredPermission);
};

export const getModulePermissions = (userPermissions: Permission[], module: string): Permission[] => {
  return userPermissions.filter(permission => permission.module === module);
};

