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

// Products localStorage functions
export const saveProductsToLocalStorage = (
  storeId: string,
  products: any[]
) => {
  try {
    localStorage.setItem(`products_${storeId}`, JSON.stringify(products));
  } catch (error) {
    console.error("Error saving products to localStorage:", error);
  }
};

export const getProductsFromLocalStorage = (storeId: string) => {
  try {
    const products = localStorage.getItem(`products_${storeId}`);
    return products ? JSON.parse(products) : null;
  } catch (error) {
    console.error("Error getting products from localStorage:", error);
    return null;
  }
};

export const clearProductsFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(`products_${storeId}`);
  } catch (error) {
    console.error("Error clearing products from localStorage:", error);
  }
};

// Categories localStorage functions
export const saveCategoriesToLocalStorage = (
  storeId: string,
  categories: any[]
) => {
  try {
    localStorage.setItem(`categories_${storeId}`, JSON.stringify(categories));
  } catch (error) {
    console.error("Error saving categories to localStorage:", error);
  }
};

export const getCategoriesFromLocalStorage = (storeId: string) => {
  try {
    const categories = localStorage.getItem(`categories_${storeId}`);
    return categories ? JSON.parse(categories) : null;
  } catch (error) {
    console.error("Error getting categories from localStorage:", error);
    return null;
  }
};

export const clearCategoriesFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(`categories_${storeId}`);
  } catch (error) {
    console.error("Error clearing categories from localStorage:", error);
  }
};

export const saveDiscountsToLocalStorage = (
  storeId: string,
  discounts: any[]
) => {
  try {
    localStorage.setItem(`discounts_${storeId}`, JSON.stringify(discounts));
  } catch (error) {
    console.error("Error saving discounts to localStorage:", error);
  }
};

export const getDiscountsFromLocalStorage = (storeId: string) => {
  try {
    const discounts = localStorage.getItem(`discounts_${storeId}`);
    return discounts ? JSON.parse(discounts) : null;
  } catch (error) {
    console.error("Error getting discounts from localStorage:", error);
    return null;
  }
};

export const clearDiscountsFromLocalStorage = (storeId: string) => {
  try {
    localStorage.removeItem(`discounts_${storeId}`);
  } catch (error) {
    console.error("Error clearing discounts from localStorage:", error);
  }
};
