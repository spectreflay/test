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
  deleteOfflineDiscount,
  markDiscountAsSynced,
  getUnsynedDiscounts,
} from "./indexedDB";
import { createNotification } from "./notification";
import { store } from "../store";
import { saleApi } from "../store/services/saleService";
import { productApi } from "../store/services/productService";
import { categoryApi } from "../store/services/categoryService";
import { inventoryApi } from "../store/services/inventoryService";
import { toast } from "react-hot-toast";
import { discountApi } from "../store/services/discountService";

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
      { action: string; data: any; offlineId: string; synced: boolean }[]
    >();

    // Group actions by product ID
    for (const product of unsynedProducts) {
      const productId = product.data._id;
      if (!actionsMap.has(productId)) {
        actionsMap.set(productId, []);
      }
      actionsMap.get(productId)!.push({
        action: product.action,
        data: product.data,
        offlineId: product.id,
        synced: false,
      });
    }

    for (const [productId, actions] of actionsMap) {
      if (processedIds.has(productId)) continue;
      processedIds.add(productId);

      try {
        let serverProductId = productId;
        let latestProductData = actions[actions.length - 1].data;

        for (const action of actions) {
          if (action.synced) continue;

          switch (action.action) {
            case "create":
              if (productId.startsWith("temp_")) {
                // Remove _id from productData to let the server generate it
                const { _id, ...productDataWithoutId } = action.data;
                const createdProduct = await store
                  .dispatch(
                    productApi.endpoints.createProduct.initiate(
                      productDataWithoutId
                    )
                  )
                  .unwrap();
                serverProductId = createdProduct._id;

                // Update local state
                store.dispatch(
                  productApi.util.updateQueryData(
                    "getProducts",
                    action.data.store,
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
              await store
                .dispatch(
                  productApi.endpoints.updateProduct.initiate({
                    ...action.data,
                    _id: serverProductId,
                  })
                )
                .unwrap();
              break;
            case "delete":
              await store
                .dispatch(
                  productApi.endpoints.deleteProduct.initiate(serverProductId)
                )
                .unwrap();
              store.dispatch(
                productApi.util.updateQueryData(
                  "getProducts",
                  action.data.store,
                  (draft) => {
                    return draft.filter((p) => p._id !== serverProductId);
                  }
                )
              );
              break;
          }

          action.synced = true;
          await markProductAsSynced(action.offlineId);
          await deleteOfflineProduct(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync product:", error);
        // If there's an error, we keep the unsynced offline data for future sync attempts
      }
    }

    return unsynedProducts.length;
  }
  private async syncCategories() {
    const unsynedCategories = await getUnsynedCategories();
    const processedIds = new Set<string>();
    const actionsMap = new Map<
      string,
      { action: string; data: any; offlineId: string; synced: boolean }[]
    >();

    // Group actions by category ID
    for (const category of unsynedCategories) {
      const categoryId = category.data._id;
      if (!actionsMap.has(categoryId)) {
        actionsMap.set(categoryId, []);
      }
      actionsMap.get(categoryId)!.push({
        action: category.action,
        data: category.data,
        offlineId: category.id,
        synced: false,
      });
    }

    for (const [categoryId, actions] of actionsMap) {
      if (processedIds.has(categoryId)) continue;
      processedIds.add(categoryId);

      try {
        let serverCategoryId = categoryId;
        let latestCategoryData = actions[actions.length - 1].data;

        for (const action of actions) {
          if (action.synced) continue;

          switch (action.action) {
            case "create":
              if (categoryId.startsWith("temp_")) {
                const createdCategory = await store
                  .dispatch(
                    categoryApi.endpoints.createCategory.initiate(action.data)
                  )
                  .unwrap();
                serverCategoryId = createdCategory._id;

                // Update local state
                store.dispatch(
                  categoryApi.util.updateQueryData(
                    "getCategories",
                    action.data.store,
                    (draft) => {
                      const index = draft.findIndex(
                        (c) => c._id === categoryId
                      );
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
              await store
                .dispatch(
                  categoryApi.endpoints.updateCategory.initiate({
                    ...action.data,
                    _id: serverCategoryId,
                  })
                )
                .unwrap();
              break;
            case "delete":
              await store
                .dispatch(
                  categoryApi.endpoints.deleteCategory.initiate(
                    serverCategoryId
                  )
                )
                .unwrap();
              store.dispatch(
                categoryApi.util.updateQueryData(
                  "getCategories",
                  action.data.store,
                  (draft) => {
                    return draft.filter((c) => c._id !== serverCategoryId);
                  }
                )
              );
              break;
          }

          action.synced = true;
          await markCategoryAsSynced(action.offlineId);
          await deleteOfflineCategory(action.offlineId);
        }
      } catch (error) {
        console.error("Failed to sync category:", error);
        // If there's an error, we keep the unsynced offline data for future sync attempts
      }
    }

    return unsynedCategories.length;
  }

  private async syncDiscounts() {
    const unsynedDiscounts = await getUnsynedDiscounts();
    let syncedCount = 0;
  
    for (const discount of unsynedDiscounts) {
      try {
        const { data, action, id: offlineId } = discount;
        let { _id: discountId, store: storeId } = data;
  
        switch (action) {
          case "create":
            if (discountId.startsWith("temp_")) {
              // Remove temporary ID and other unnecessary fields
              const { _id, createdAt, updatedAt, ...discountData } = data;
              
              // Create new discount
              const createdDiscount = await store.dispatch(
                discountApi.endpoints.createDiscount.initiate(discountData)
              ).unwrap();
  
              // Update local state
              store.dispatch(
                discountApi.util.updateQueryData(
                  "getDiscounts",
                  storeId,
                  (draft) => {
                    const index = draft.findIndex((d) => d._id === discountId);
                    if (index !== -1) {
                      draft[index] = createdDiscount;
                    } else {
                      draft.push(createdDiscount);
                    }
                  }
                )
              );
  
              // Update discountId to the newly created ID
              discountId = createdDiscount._id;
            }
            break;
  
          case "update":
            const { createdAt, updatedAt, ...updateData } = data;
            await store.dispatch(
              discountApi.endpoints.updateDiscount.initiate({
                _id: discountId,
                ...updateData,
              })
            ).unwrap();
            break;
  
          case "delete":
            await store.dispatch(
              discountApi.endpoints.deleteDiscount.initiate(discountId)
            ).unwrap();
  
            // Update local state
            store.dispatch(
              discountApi.util.updateQueryData(
                "getDiscounts",
                storeId,
                (draft) => {
                  return draft.filter((d) => d._id !== discountId);
                }
              )
            );
            break;
        }
  
        // Mark as synced and clean up
        await markDiscountAsSynced(offlineId);
        await deleteOfflineDiscount(offlineId);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync discount:", error);
        // Don't throw error, continue with next discount
      }
    }
  
    return syncedCount;
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
        discountsCount,
        inventoryCount,
        salesCount,
        reportsCount,
      ] = await Promise.all([
        this.syncProducts(),
        this.syncCategories(),
        this.syncDiscounts(),
        this.syncInventory(),
        this.syncSales(),
        this.syncReports(),
      ]);

      const syncedEntities = [
        { type: "product", count: productsCount },
        { type: "category", count: categoriesCount },
        { type: "discount", count: discountsCount },
        { type: "inventory", count: inventoryCount },
        { type: "sale", count: salesCount },
        { type: "report", count: reportsCount },
      ].filter((entity) => entity.count > 0);

      const totalSynced = syncedEntities.reduce(
        (sum, entity) => sum + entity.count,
        0
      );

      if (totalSynced > 0) {
        // Show individual entity sync notifications
        for (const entity of syncedEntities) {
          const message = `Successfully synchronized ${entity.count} ${
            entity.type
          }${entity.count > 1 ? "s" : ""}`;
          await createNotification(store.dispatch, message, "system");
          toast.success(message);
        }

        // Show overall sync notification
        const overallMessage = `Successfully synchronized ${totalSynced} total item${
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
