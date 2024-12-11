import { networkStatus } from "./networkStatus";
import {
  getUnsynedSales,
  getUnsynedProducts,
  getUnsynedCategories,
  getUnsynedInventory,
  getUnsynedReports,
  markSaleAsSynced,
  markProductAsSynced,
  markCategoryAsSynced,
  markInventoryAsSynced,
  markReportAsSynced,
  deleteOfflineSale,
  deleteOfflineProduct,
  deleteOfflineCategory,
  deleteOfflineInventory,
  deleteOfflineReport,
  getOfflineProductById,
} from "./indexedDB";
import { createNotification } from "./notification";
import { store } from "../store";
import { saleApi } from "../store/services/saleService";
import { productApi } from "../store/services/productService";
import { categoryApi } from "../store/services/categoryService";
import { inventoryApi } from "../store/services/inventoryService";
import { toast } from "react-hot-toast";

class SyncManager {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListener();
    this.startPeriodicSync();
  }

  private setupNetworkListener() {
    networkStatus.addCallback((online) => {
      if (online) {
        this.syncOfflineData();
      }
    });
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (networkStatus.isNetworkOnline()) {
        this.syncOfflineData();
      }
    }, 60000); // Check every minute
  }

  private async syncProducts() {
    const unsynedProducts = await getUnsynedProducts();
    const processedIds = new Set<string>();
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string }[]
    >();

    // Group actions by product ID
    for (const product of unsynedProducts) {
      const productId = product.data._id;
      if (!actionsMap.has(productId)) {
        actionsMap.set(productId, []);
      }
      actionsMap
        .get(productId)!
        .push({
          action: product.action,
          data: product.data,
          offlineId: product.id,
        });
    }

    for (const [productId, actions] of actionsMap) {
      if (processedIds.has(productId)) continue;
      processedIds.add(productId);

      // Check if the product was created and deleted offline
      const wasCreatedOffline =
        actions[0].action === "create" && productId.startsWith("temp_");
      const wasDeletedOffline = actions[actions.length - 1].action === "delete";

      if (wasCreatedOffline && wasDeletedOffline) {
        // Product was created and deleted offline, remove all related actions
        for (const action of actions) {
          await deleteOfflineProduct(action.offlineId);
        }
        continue; // Skip to next product
      }

      try {
        let finalAction = actions[actions.length - 1];

        switch (finalAction.action) {
          case "create":
            if (!wasCreatedOffline) {
              const createdProduct = await store
                .dispatch(
                  productApi.endpoints.createProduct.initiate(finalAction.data)
                )
                .unwrap();
              store.dispatch(
                productApi.util.updateQueryData(
                  "getProducts",
                  finalAction.data.store,
                  (draft) => {
                    const index = draft.findIndex((p) => p._id === productId);
                    if (index !== -1) {
                      draft[index] = createdProduct;
                    } else {
                      draft.push(createdProduct);
                    }
                  }
                )
              );
            }
            break;
          case "update":
            if (!wasCreatedOffline) {
              await store
                .dispatch(
                  productApi.endpoints.updateProduct.initiate(finalAction.data)
                )
                .unwrap();
            }
            break;
          case "delete":
            if (!wasCreatedOffline) {
              await store
                .dispatch(
                  productApi.endpoints.deleteProduct.initiate(productId)
                )
                .unwrap();
              store.dispatch(
                productApi.util.updateQueryData(
                  "getProducts",
                  finalAction.data.store,
                  (draft) => {
                    return draft.filter((p) => p._id !== productId);
                  }
                )
              );
            }
            break;
        }

        // Mark all actions for this product as synced and remove them
        for (const action of actions) {
          await markProductAsSynced(action.offlineId);
          await deleteOfflineProduct(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync product:", error);
        // If there's an error, we keep the offline data for future sync attempts
        // But we still remove the 'create' action if it was followed by a 'delete'
        if (wasCreatedOffline && wasDeletedOffline) {
          for (const action of actions) {
            await deleteOfflineProduct(action.offlineId);
          }
        }
      }
    }

    return unsynedProducts.length;
  }

  private async syncCategories() {
    const unsynedCategories = await getUnsynedCategories();
    const processedIds = new Set<string>();
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string }[]
    >();

    // Group actions by category ID
    for (const category of unsynedCategories) {
      const categoryId = category.data._id;
      if (!actionsMap.has(categoryId)) {
        actionsMap.set(categoryId, []);
      }
      actionsMap
        .get(categoryId)!
        .push({
          action: category.action,
          data: category.data,
          offlineId: category.id,
        });
    }

    for (const [categoryId, actions] of actionsMap) {
      if (processedIds.has(categoryId)) continue;
      processedIds.add(categoryId);

      // Check if the category was created and deleted offline
      const wasCreatedOffline =
        actions[0].action === "create" && categoryId.startsWith("temp_");
      const wasDeletedOffline = actions[actions.length - 1].action === "delete";

      if (wasCreatedOffline && wasDeletedOffline) {
        // Category was created and deleted offline, remove all related actions
        for (const action of actions) {
          await deleteOfflineCategory(action.offlineId);
        }
        continue; // Skip to next category
      }

      try {
        let finalAction = actions[actions.length - 1];

        switch (finalAction.action) {
          case "create":
            if (!wasCreatedOffline) {
              const createdCategory = await store
                .dispatch(
                  categoryApi.endpoints.createCategory.initiate(
                    finalAction.data
                  )
                )
                .unwrap();
              store.dispatch(
                categoryApi.util.updateQueryData(
                  "getCategories",
                  finalAction.data.store,
                  (draft) => {
                    const index = draft.findIndex((c) => c._id === categoryId);
                    if (index !== -1) {
                      draft[index] = createdCategory;
                    } else {
                      draft.push(createdCategory);
                    }
                  }
                )
              );
            }
            break;
          case "update":
            if (!wasCreatedOffline) {
              await store
                .dispatch(
                  categoryApi.endpoints.updateCategory.initiate(
                    finalAction.data
                  )
                )
                .unwrap();
            }
            break;
          case "delete":
            if (!wasCreatedOffline) {
              await store
                .dispatch(
                  categoryApi.endpoints.deleteCategory.initiate(categoryId)
                )
                .unwrap();
              store.dispatch(
                categoryApi.util.updateQueryData(
                  "getCategories",
                  finalAction.data.store,
                  (draft) => {
                    return draft.filter((c) => c._id !== categoryId);
                  }
                )
              );
            }
            break;
        }

        // Mark all actions for this category as synced and remove them
        for (const action of actions) {
          await markCategoryAsSynced(action.offlineId);
          await deleteOfflineCategory(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync category:", error);
        // If there's an error, we keep the offline data for future sync attempts
        // But we still remove the 'create' action if it was followed by a 'delete'
        if (wasCreatedOffline && wasDeletedOffline) {
          for (const action of actions) {
            await deleteOfflineCategory(action.offlineId);
          }
        }
      }
    }

    return unsynedCategories.length;
  }

  private async syncInventory() {
    const unsynedInventory = await getUnsynedInventory();
    for (const inventory of unsynedInventory) {
      try {
        switch (inventory.action) {
          case "create":
          case "update":
            await store
              .dispatch(
                inventoryApi.endpoints.addStockMovement.initiate(inventory.data)
              )
              .unwrap();
            break;
        }
        await markInventoryAsSynced(inventory.id);
        await deleteOfflineInventory(inventory.id);
      } catch (error) {
        console.error("Failed to sync inventory:", error);
      }
    }
    return unsynedInventory.length;
  }

  private async syncSales() {
    const unsynedSales = await getUnsynedSales();
    for (const sale of unsynedSales) {
      try {
        await store
          .dispatch(saleApi.endpoints.createSale.initiate(sale.data))
          .unwrap();
        await markSaleAsSynced(sale.id);
        await deleteOfflineSale(sale.id);
      } catch (error) {
        console.error("Failed to sync sale:", error);
      }
    }
    return unsynedSales.length;
  }

  private async syncReports() {
    const unsynedReports = await getUnsynedReports();
    for (const report of unsynedReports) {
      try {
        // Store reports locally until online
        await markReportAsSynced(report.id);
        await deleteOfflineReport(report.id);
      } catch (error) {
        console.error("Failed to sync report:", error);
      }
    }
    return unsynedReports.length;
  }

  public async syncOfflineData() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;

      // Sync all entity types and get counts
      const [
        productsCount,
        categoriesCount,
        inventoryCount,
        salesCount,
        reportsCount,
      ] = await Promise.all([
        this.syncProducts(),
        this.syncCategories(),
        this.syncInventory(),
        this.syncSales(),
        this.syncReports(),
      ]);

      const syncedEntities = [
        { type: "product", count: productsCount },
        { type: "category", count: categoriesCount },
        { type: "inventory", count: inventoryCount },
        { type: "sale", count: salesCount },
        { type: "report", count: reportsCount },
      ].filter((entity) => entity.count > 0);

      const totalSynced = syncedEntities.reduce(
        (sum, entity) => sum + entity.count,
        0
      );

      // Only create notifications and show toasts if there was data to sync
      if (totalSynced > 0) {
        for (const entity of syncedEntities) {
          const message = `Successfully synchronized ${entity.count} ${
            entity.type
          }${entity.count > 1 ? "s" : ""} offline items`;
          await createNotification(store.dispatch, message, "system");
          toast.success(message);
        }

        const overallMessage = `Successfully synchronized ${totalSynced} total offline item${
          totalSynced > 1 ? "s" : ""
        }`;
        await createNotification(store.dispatch, overallMessage, "system");
        toast.success(overallMessage);
      }
    } catch (error) {
      console.error("Error during sync process:", error);
      const errorMessage = "Some data failed to sync. Will retry later.";
      await createNotification(store.dispatch, errorMessage, "alert");
      toast.error(errorMessage);
    } finally {
      this.isSyncing = false;
    }
  }

  public cleanup() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const syncManager = new SyncManager();
