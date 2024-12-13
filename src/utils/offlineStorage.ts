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
  INVENTORY: (storeId: string) => `inventory_${storeId}`,
  STOCK_MOVEMENTS: (storeId: string) => `stock_movements_${storeId}`,
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
        // Update local storage cache for stock movements
        const movements = getStockMovementsFromLocalStorage(data.store) || [];
        movements.push({
          ...data,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: "pending_sync",
        });
        saveStockMovementsToLocalStorage(data.store, movements);
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
          status: "pending_sync",
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
export const saveProductsToLocalStorage = (
  storeId: string,
  products: any[]
) => {
  try {
    localStorage.setItem(
      CACHE_KEYS.PRODUCTS(storeId),
      JSON.stringify(products)
    );
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
export const saveCategoriesToLocalStorage = (
  storeId: string,
  categories: any[]
) => {
  try {
    localStorage.setItem(
      CACHE_KEYS.CATEGORIES(storeId),
      JSON.stringify(categories)
    );
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
export const saveDiscountsToLocalStorage = (
  storeId: string,
  discounts: any[]
) => {
  try {
    localStorage.setItem(
      CACHE_KEYS.DISCOUNTS(storeId),
      JSON.stringify(discounts)
    );
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

// Stock Movements
export const saveStockMovementsToLocalStorage = (
  storeId: string,
  movements: any[]
) => {
  try {
    localStorage.setItem(
      CACHE_KEYS.STOCK_MOVEMENTS(storeId),
      JSON.stringify(movements)
    );
  } catch (error) {
    console.error("Error saving stock movements to localStorage:", error);
  }
};

export const getStockMovementsFromLocalStorage = (storeId: string) => {
  try {
    const movements = localStorage.getItem(CACHE_KEYS.STOCK_MOVEMENTS(storeId));
    return movements ? JSON.parse(movements) : null;
  } catch (error) {
    console.error("Error getting stock movements from localStorage:", error);
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

// Store
export const saveStoreToLocalStorage = (storeId: string, store: any) => {
  try {
    localStorage.setItem(`store_${storeId}`, JSON.stringify(store));
  } catch (error) {
    console.error("Error saving store to localStorage:", error);
  }
};

export const getStoreFromLocalStorage = (storeId: string) => {
  try {
    const store = localStorage.getItem(`store_${storeId}`);
    return store ? JSON.parse(store) : null;
  } catch (error) {
    console.error("Error getting store from localStorage:", error);
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

<<<<<<< HEAD
export const clearStockMovementsFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(CACHE_KEYS.STOCK_MOVEMENTS(storeId));
  } catch (error) {
    console.error("Error clearing stock movements from localStorage:", error);
  }
};

export const clearStoreFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(`store_${storeId}`);
  } catch (error) {
    console.error("Error clearing store from localStorage:", error);
=======
export const saveReportsToLocalStorage = (storeId: string, reports: any[]) => {
  try {
    localStorage.setItem(`reports_${storeId}`, JSON.stringify(reports));
  } catch (error) {
    console.error("Error saving reports to localStorage:", error);
  }
};

export const getReportsFromLocalStorage = (storeId: string) => {
  try {
    const reports = localStorage.getItem(`reports_${storeId}`);
    return reports ? JSON.parse(reports) : null;
  } catch (error) {
    console.error("Error getting reports from localStorage:", error);
    return null;
  }
};

export const clearReportsFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(`reports_${storeId}`);
  } catch (error) {
    console.error("Error clearing reports from localStorage:", error);
>>>>>>> 35ab505b8f0365a21d19411ab1a98ce4147950cf
  }
};
