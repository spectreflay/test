import { networkStatus } from "./networkStatus";
import {
  saveOfflineProduct,
  saveOfflineCategory,
  saveOfflineInventory,
  saveOfflineReport,
  saveOfflineSale,
  saveOfflineDiscount,
} from "./indexedDB";
import { toast } from "react-hot-toast";

// Cache keys
const CACHE_KEYS = {
  PRODUCTS: (storeId: string) => `products_${storeId}`,
  CATEGORIES: (storeId: string) => `categories_${storeId}`,
  DISCOUNTS: (storeId: string) => `discounts_${storeId}`,
  SALES: (storeId: string) => `sales_${storeId}`,
};

export const handleOfflineAction = async (
  entityType:
    | "product"
    | "category"
    | "inventory"
    | "discount"
    | "report"
    | "sale",
  action: "create" | "update" | "delete",
  data: any
) => {
  if (networkStatus.isNetworkOnline()) {
    return false; // Not handled offline
  }

  try {
    switch (entityType) {
      case "product":
        await saveOfflineProduct(data, action);
        break;
      case "category":
        await saveOfflineCategory(data, action);
        break;
      case "discount":
        await saveOfflineDiscount(data, action);
        break;
      case "inventory":
        await saveOfflineInventory(data, action);
        break;
      case "report":
        await saveOfflineReport(data);
        break;
      case "sale":
        await saveOfflineSale(data);
        // Update local storage cache for sales
        const sales = getSalesFromLocalStorage(data.store) || [];
        sales.push({
          ...data,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending_sync'
        });
        saveSalesToLocalStorage(data.store, sales);
        break;
    }
    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    toast.success(
      `${entityName} saved offline. Will sync when connection is restored.`
    );
    return true; // Handled offline
  } catch (error) {
    console.error("Failed to save offline data:", error);
    toast.error("Failed to save data offline");
    return false;
  }
};

// Products
export const saveProductsToLocalStorage = (storeId: string, products: any[]) => {
  try {
    localStorage.setItem(CACHE_KEYS.PRODUCTS(storeId), JSON.stringify(products));
  } catch (error) {
    console.error("Error saving products to localStorage:", error);
  }
};

export const getProductsFromLocalStorage = (storeId: string) => {
  try {
    const products = localStorage.getItem(CACHE_KEYS.PRODUCTS(storeId));
    return products ? JSON.parse(products) : null;
  } catch (error) {
    console.error("Error getting products from localStorage:", error);
    return null;
  }
};

// Categories
export const saveCategoriesToLocalStorage = (storeId: string, categories: any[]) => {
  try {
    localStorage.setItem(CACHE_KEYS.CATEGORIES(storeId), JSON.stringify(categories));
  } catch (error) {
    console.error("Error saving categories to localStorage:", error);
  }
};

export const getCategoriesFromLocalStorage = (storeId: string) => {
  try {
    const categories = localStorage.getItem(CACHE_KEYS.CATEGORIES(storeId));
    return categories ? JSON.parse(categories) : null;
  } catch (error) {
    console.error("Error getting categories from localStorage:", error);
    return null;
  }
};

// Discounts
export const saveDiscountsToLocalStorage = (storeId: string, discounts: any[]) => {
  try {
    localStorage.setItem(CACHE_KEYS.DISCOUNTS(storeId), JSON.stringify(discounts));
  } catch (error) {
    console.error("Error saving discounts to localStorage:", error);
  }
};

export const getDiscountsFromLocalStorage = (storeId: string) => {
  try {
    const discounts = localStorage.getItem(CACHE_KEYS.DISCOUNTS(storeId));
    return discounts ? JSON.parse(discounts) : null;
  } catch (error) {
    console.error("Error getting discounts from localStorage:", error);
    return null;
  }
};

// Sales
export const saveSalesToLocalStorage = (storeId: string, sales: any[]) => {
  try {
    localStorage.setItem(CACHE_KEYS.SALES(storeId), JSON.stringify(sales));
  } catch (error) {
    console.error("Error saving sales to localStorage:", error);
  }
};

export const getSalesFromLocalStorage = (storeId: string) => {
  try {
    const sales = localStorage.getItem(CACHE_KEYS.SALES(storeId));
    return sales ? JSON.parse(sales) : null;
  } catch (error) {
    console.error("Error getting sales from localStorage:", error);
    return null;
  }
};

// Clear cache functions
export const clearProductsFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(CACHE_KEYS.PRODUCTS(storeId));
  } catch (error) {
    console.error("Error clearing products from localStorage:", error);
  }
};

export const clearCategoriesFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(CACHE_KEYS.CATEGORIES(storeId));
  } catch (error) {
    console.error("Error clearing categories from localStorage:", error);
  }
};

export const clearDiscountsFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(CACHE_KEYS.DISCOUNTS(storeId));
  } catch (error) {
    console.error("Error clearing discounts from localStorage:", error);
  }
};

export const clearSalesFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(CACHE_KEYS.SALES(storeId));
  } catch (error) {
    console.error("Error clearing sales from localStorage:", error);
  }
};