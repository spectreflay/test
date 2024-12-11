import { StoreSettings } from '../store/services/storeService';

export const checkStockLevel = (currentStock: number, settings: StoreSettings) => {
  if (currentStock <= settings.outOfStockThreshold) {
    return 'out_of_stock';
  }
  if (currentStock <= settings.criticalStockThreshold) {
    return 'critical';
  }
  if (currentStock <= settings.lowStockThreshold) {
    return 'low';
  }
  return 'normal';
};

export const shouldCreateStockAlert = (
  currentStock: number,
  settings: StoreSettings
): boolean => {
  if (!settings.enableStockAlerts) return false;
  
  return (
    currentStock <= settings.outOfStockThreshold ||
    currentStock <= settings.criticalStockThreshold ||
    currentStock <= settings.lowStockThreshold
  );
};

export const getStockAlertMessage = (
  productName: string,
  currentStock: number,
  settings: StoreSettings
): string => {
  if (currentStock <= settings.outOfStockThreshold) {
    return `Out of stock alert: ${productName} is out of stock!`;
  }
  if (currentStock <= settings.criticalStockThreshold) {
    return `Critical stock alert: ${productName} has critically low stock (${currentStock} units)`;
  }
  if (currentStock <= settings.lowStockThreshold) {
    return `Low stock alert: ${productName} is running low (${currentStock} units)`;
  }
  return '';
};

export const getStockAlertType = (
  currentStock: number,
  settings: StoreSettings
): 'out_of_stock' | 'low_stock' | 'critical' | null => {
  if (!settings.enableStockAlerts) return null;
  
  if (currentStock <= settings.outOfStockThreshold) {
    return 'out_of_stock';
  }
  if (currentStock <= settings.criticalStockThreshold) {
    return 'critical';
  }
  if (currentStock <= settings.lowStockThreshold) {
    return 'low_stock';
  }
  return null;
};

export const getStockStatusColor = (currentStock: number, settings: StoreSettings): string => {
  const status = checkStockLevel(currentStock, settings);
  switch (status) {
    case 'out_of_stock':
      return 'text-red-600';
    case 'critical':
      return 'text-orange-600';
    case 'low':
      return 'text-yellow-600';
    default:
      return 'text-green-600';
  }
};