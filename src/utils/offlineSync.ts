import { toast } from "react-hot-toast";
import { networkStatus } from "./networkStatus";
import {
  saveOfflineProduct,
  saveOfflineCategory,
  saveOfflineInventory,
  saveOfflineReport,
  getUnsynedProducts,
  getUnsynedCategories,
  getUnsynedInventory,
  getUnsynedReports,
  markProductAsSynced,
  markCategoryAsSynced,
  markInventoryAsSynced,
  markReportAsSynced,
  deleteOfflineProduct,
  deleteOfflineCategory,
  deleteOfflineInventory,
  deleteOfflineReport,
} from "./indexedDB";

import { store } from "../store";
import { api } from "../store/api";

// Generic offline action handler
export const handleOfflineAction = async <T>(
  entityType: "product" | "category" | "inventory" | "report",
  action: "create" | "update" | "delete",
  data: T
): Promise<boolean> => {
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
      case "inventory":
        await saveOfflineInventory(data, action);
        break;
      case "report":
        await saveOfflineReport(data);
        break;
    }

    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    toast.success(
      `${entityName} saved offline. Will sync when connection is restored.`
    );
    return true; // Handled offline
  } catch (error) {
    console.error("Failed to save offline data:", error);
    toast.error(`Failed to save ${entityType} offline`);
    return false;
  }
};

export const syncEntityData = async (
  entityType: "product" | "category" | "inventory" | "report"
): Promise<void> => {
  let unsynced;
  switch (entityType) {
    case "product":
      unsynced = await getUnsynedProducts();
      break;
    case "category":
      unsynced = await getUnsynedCategories();
      break;
    case "inventory":
      unsynced = await getUnsynedInventory();
      break;
    case "report":
      unsynced = await getUnsynedReports();
      break;
  }

  const processedIds = new Set();

  for (const item of unsynced) {
    if (processedIds.has(item.data._id)) {
      // Skip if we've already processed this ID
      await deleteOfflineEntity(entityType, item.id);
      continue;
    }

    processedIds.add(item.data._id);

    try {
      let endpoint;
      switch (entityType) {
        case "product":
          endpoint =
            item.action === "create"
              ? "createProduct"
              : item.action === "update"
              ? "updateProduct"
              : "deleteProduct";
          break;
        case "category":
          endpoint =
            item.action === "create"
              ? "createCategory"
              : item.action === "update"
              ? "updateCategory"
              : "deleteCategory";
          break;
        case "inventory":
          endpoint = "addStockMovement";
          break;
        case "report":
          endpoint = "createReport";
          break;
      }

      if (item.action === "delete") {
        // For delete actions, first check if the entity exists
        const checkEndpoint = `get${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
        try {
          await store.dispatch(api.endpoints[checkEndpoint].initiate(item.data._id)).unwrap();
        } catch (checkError) {
          if (checkError.status === 404) {
            // Entity doesn't exist, so we can safely remove the offline data
            await deleteOfflineEntity(entityType, item.id);
            continue;
          }
        }
      }

      await store
        .dispatch(api.endpoints[endpoint].initiate(item.data))
        .unwrap();

      // If we reach here, the operation was successful
      await markEntityAsSynced(entityType, item.id);
      await deleteOfflineEntity(entityType, item.id);
    } catch (error) {
      console.error(`Failed to sync ${entityType}:`, error);

      // Check if the error is a 404 (Not Found)
      if (error.status === 404) {
        console.log(
          `${entityType} with id ${item.data._id} not found. It may have been already deleted or doesn't exist.`
        );
        // Remove the offline data as the item doesn't exist on the server
        await deleteOfflineEntity(entityType, item.id);
      } else {
        // For other errors, we might want to keep the offline data for future sync attempts
        console.error(`Error syncing ${entityType}:`, error);
      }
    }
  }
};

// Helper functions to make the code more DRY
const markEntityAsSynced = async (entityType: string, id: string) => {
  switch (entityType) {
    case "product":
      await markProductAsSynced(id);
      break;
    case "category":
      await markCategoryAsSynced(id);
      break;
    case "inventory":
      await markInventoryAsSynced(id);
      break;
    case "report":
      await markReportAsSynced(id);
      break;
  }
};

const deleteOfflineEntity = async (entityType: string, id: string) => {
  switch (entityType) {
    case "product":
      await deleteOfflineProduct(id);
      break;
    case "category":
      await deleteOfflineCategory(id);
      break;
    case "inventory":
      await deleteOfflineInventory(id);
      break;
    case "report":
      await deleteOfflineReport(id);
      break;
  }
};

